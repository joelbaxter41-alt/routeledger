begin;
alter table invoices add column request_id uuid unique,add column request_payload jsonb;
alter table estimates add column request_id uuid unique,add column request_payload jsonb;

-- Validate the complete input before creating a document. Never round quantities
-- during parsing; only round each exact extended monetary value.
create function public.document_subtotal(p_items jsonb) returns bigint language plpgsql immutable set search_path=public as $$
declare item record; subtotal numeric:=0;
begin
 if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Line items must be an array';end if;
 if jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>50 then raise exception 'Use between 1 and 50 line items';end if;
 for item in select * from jsonb_to_recordset(p_items) as x(description text,quantity_milli numeric,unit_cents numeric) loop
  if item.description is null or length(trim(item.description))<1 or length(item.description)>2000 or item.quantity_milli is null or item.quantity_milli<=0 or item.quantity_milli>1000000 or item.quantity_milli<>trunc(item.quantity_milli) or item.unit_cents is null or item.unit_cents<0 or item.unit_cents>1000000000000 or item.unit_cents<>trunc(item.unit_cents) then raise exception 'Invalid line item';end if;
  subtotal:=subtotal+round(item.quantity_milli*item.unit_cents/1000);
 end loop;
 if subtotal>1000000000000 then raise exception 'Document subtotal exceeds supported amount';end if;
 return subtotal::bigint;
end$$;

create function public.create_invoice_with_items(p_org uuid,p_customer uuid,p_job uuid,p_items jsonb,p_tax integer,p_due date,p_notes text,p_request uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;existing invoices;subtotal bigint;payload jsonb;
begin
 if not is_manager(p_org) or not has_pro(p_org) then raise exception 'Pro plan and manager permissions required';end if;
 if p_request is null or p_due is null or p_tax is null or p_tax<0 or p_tax>10000 or length(coalesce(p_notes,''))>2000 then raise exception 'Invalid invoice details';end if;
 subtotal:=document_subtotal(p_items);
 payload:=jsonb_build_object('customer',p_customer,'job',p_job,'items',p_items,'tax',p_tax,'due',p_due,'notes',coalesce(p_notes,''));
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,2));
 select * into existing from invoices where request_id=p_request;
 if found then
  if existing.organization_id<>p_org or existing.request_payload<>payload then raise exception 'Request identifier already used for different details';end if;
  return existing.id;
 end if;
 result:=create_invoice(p_org,p_customer,p_job,p_items->0->>'description',subtotal,1000,p_tax,p_due,coalesce(p_notes,''));
 delete from invoice_items where invoice_id=result;
 insert into invoice_items(organization_id,invoice_id,description,quantity_milli,unit_cents) select p_org,result,trim(description),quantity_milli::integer,unit_cents::bigint from jsonb_to_recordset(p_items) as x(description text,quantity_milli numeric,unit_cents numeric);
 update invoices set request_id=p_request,request_payload=payload where id=result;
 return result;
end$$;

create function public.create_estimate_with_items(p_org uuid,p_customer uuid,p_description text,p_items jsonb,p_expires date,p_notes text,p_request uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;existing estimates;subtotal bigint;payload jsonb;
begin
 if not is_manager(p_org) or not has_pro(p_org) then raise exception 'Pro plan and manager permissions required';end if;
 if p_request is null or p_expires is null or p_description is null or length(trim(p_description))<1 or length(p_description)>2000 or length(coalesce(p_notes,''))>2000 then raise exception 'Invalid estimate details';end if;
 subtotal:=document_subtotal(p_items);
 payload:=jsonb_build_object('customer',p_customer,'description',p_description,'items',p_items,'expires',p_expires,'notes',coalesce(p_notes,''));
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,3));
 select * into existing from estimates where request_id=p_request;
 if found then
  if existing.organization_id<>p_org or existing.request_payload<>payload then raise exception 'Request identifier already used for different details';end if;
  return existing.id;
 end if;
 result:=create_estimate(p_org,p_customer,trim(p_description),subtotal,p_expires,coalesce(p_notes,''));
 delete from estimate_items where estimate_id=result;
 insert into estimate_items(organization_id,estimate_id,description,quantity_milli,unit_cents) select p_org,result,trim(description),quantity_milli::integer,unit_cents::bigint from jsonb_to_recordset(p_items) as x(description text,quantity_milli numeric,unit_cents numeric);
 update estimates set request_id=p_request,request_payload=payload where id=result;
 insert into audit_events(organization_id,actor_id,event,record_id) values(p_org,auth.uid(),'estimate.created',result);
 return result;
end$$;
revoke all on function create_invoice_with_items(uuid,uuid,uuid,jsonb,integer,date,text,uuid),create_estimate_with_items(uuid,uuid,text,jsonb,date,text,uuid) from public,anon;
grant execute on function create_invoice_with_items(uuid,uuid,uuid,jsonb,integer,date,text,uuid),create_estimate_with_items(uuid,uuid,text,jsonb,date,text,uuid) to authenticated;
commit;
