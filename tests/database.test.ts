import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002";
let orgA: string,
  orgB: string,
  customerA: string,
  customerB: string,
  jobA: string,
  invoiceA: string;
async function user(id: string) {
  await db.exec(
    `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
async function scalar(sql: string) {
  return (await db.query<{ id: string }>(sql)).rows[0]?.id;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role bypassrls;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${a}'),('${b}');`,
  );
  const migrationFiles = (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of migrationFiles) {
    const migration = (
      await readFile(`supabase/migrations/${file}`, "utf8")
    ).replace("create extension if not exists pgcrypto;", "");
    await db.exec(migration);
  }
  await db.exec(`grant usage on schema public to authenticated;`);
  await user(a);
  orgA = (await scalar(
    `select create_organization('Business A','Lawn care','America/Denver','USD') id`,
  ))!;
  customerA = (await scalar(
    `insert into customers(organization_id,name) values('${orgA}','Customer A') returning id`,
  ))!;
  await user(b);
  orgB = (await scalar(
    `select create_organization('Business B','Cleaning','America/New_York','USD') id`,
  ))!;
  customerB = (await scalar(
    `insert into customers(organization_id,name) values('${orgB}','Customer B') returning id`,
  ))!;
});
afterAll(async () => {
  await db.close();
});
describe("actual PostgreSQL migration and authorization", () => {
  it("isolates tenant reads and blocks spoofed inserts", async () => {
    await user(a);
    expect((await db.query("select * from customers")).rows).toHaveLength(1);
    expect(
      (await db.query(`select * from customers where id='${customerB}'`)).rows,
    ).toHaveLength(0);
    await expect(
      db.exec(
        `insert into customers(organization_id,name) values('${orgB}','Intruder')`,
      ),
    ).rejects.toThrow(/row-level security|permission denied/g);
  });
  it("blocks cross-tenant foreign keys and membership escalation", async () => {
    await user(a);
    await expect(
      db.exec(
        `insert into jobs(organization_id,customer_id,description,scheduled_date,quoted_cents) values('${orgA}','${customerB}','Cross tenant',current_date,10000)`,
      ),
    ).rejects.toThrow(/foreign key/);
    await expect(
      db.exec(
        `insert into organization_memberships values('${orgB}','${a}','owner')`,
      ),
    ).rejects.toThrow(/row-level security|permission denied/g);
  });
  it("enforces Starter customer limit in the database", async () => {
    await user(a);
    await db.exec(
      `insert into customers(organization_id,name) select '${orgA}','Customer '||i from generate_series(2,10) i`,
    );
    await expect(
      db.exec(
        `insert into customers(organization_id,name) values('${orgA}','Eleventh')`,
      ),
    ).rejects.toThrow(/10 active customers/);
  });
  it("enforces lifecycle and completion snapshots", async () => {
    await user(a);
    jobA = (await scalar(
      `insert into jobs(organization_id,customer_id,description,scheduled_date,quoted_cents,labor_rate_cents) values('${orgA}','${customerA}','Mow lawn',current_date,10000,2500) returning id`,
    ))!;
    await expect(
      db.exec(`update jobs set status='completed' where id='${jobA}'`),
    ).rejects.toThrow(/Invalid job/);
    await db.exec(
      `update jobs set status='in_progress' where id='${jobA}';update jobs set status='completed',actual_minutes=60 where id='${jobA}';`,
    );
    const row = (
      await db.query<{ final_cents: number; completed_at: string }>(
        `select final_cents,completed_at from jobs where id='${jobA}'`,
      )
    ).rows[0];
    expect(Number(row.final_cents)).toBe(10000);
    expect(row.completed_at).toBeTruthy();
    await expect(
      db.exec(`update jobs set quoted_cents=1 where id='${jobA}'`),
    ).rejects.toThrow(/historical/);
  });
  it("denies invoice creation without verified billing and denies forged subscriptions", async () => {
    await user(a);
    await expect(
      db.exec(
        `select create_invoice('${orgA}','${customerA}','${jobA}','Mow lawn',10000,1000,825,current_date,'')`,
      ),
    ).rejects.toThrow(/Pro plan/);
    await expect(
      db.exec(
        `insert into subscriptions(organization_id,status,period_end,verified_at) values('${orgA}','active',now()+interval '1 month',now())`,
      ),
    ).rejects.toThrow(/row-level security|permission denied/g);
    await db.exec(
      `reset role;insert into subscriptions(organization_id,status,period_end,verified_at) values('${orgA}','active',now()+interval '1 month',now());`,
    );
  });
  it("creates invoices transactionally and rejects duplicate job invoices", async () => {
    await user(a);
    invoiceA = (await scalar(
      `select create_invoice('${orgA}','${customerA}','${jobA}','Mow lawn',10000,1000,825,current_date,'') id`,
    ))!;
    expect(
      Number(
        (await db.query<{ n: string }>(`select invoice_total('${invoiceA}') n`))
          .rows[0].n,
      ),
    ).toBe(10825);
    await expect(
      db.exec(
        `select create_invoice('${orgA}','${customerA}','${jobA}','Mow lawn',10000,1000,0,current_date,'')`,
      ),
    ).rejects.toThrow(/unique/);
  });
  it("rejects foreign financial actions", async () => {
    await user(b);
    await expect(
      db.exec(
        `select record_payment('${invoiceA}',100,current_date,'intruder',gen_random_uuid())`,
      ),
    ).rejects.toThrow(/permissions/);
    expect(
      (await db.query(`select * from invoices where id='${invoiceA}'`)).rows,
    ).toHaveLength(0);
  });
  it("records partial payments exactly once and rejects overpayments", async () => {
    await user(a);
    const request = "00000000-0000-4000-8000-000000000099";
    await db.exec(
      `select record_payment('${invoiceA}',5000,current_date,'cash','${request}');select record_payment('${invoiceA}',5000,current_date,'cash','${request}');`,
    );
    expect((await db.query("select * from payments")).rows).toHaveLength(1);
    await expect(
      db.exec(
        `select record_payment('${invoiceA}',6000,current_date,'too much',gen_random_uuid())`,
      ),
    ).rejects.toThrow(/exceeds/);
    await db.exec(
      `select record_payment('${invoiceA}',5825,current_date,'bank',gen_random_uuid())`,
    );
    expect(
      Number(
        (
          await db.query<{ n: string }>(
            "select sum(amount_cents) n from payments",
          )
        ).rows[0].n,
      ),
    ).toBe(10825);
    await expect(
      db.exec(`select set_invoice_status('${invoiceA}','voided')`),
    ).rejects.toThrow(/cannot be voided/);
    await expect(db.exec(`delete from payments`)).rejects.toThrow(
      /permission denied/,
    );
    expect((await db.query("select * from payments")).rows).toHaveLength(2);
  });
  it("converts estimates idempotently", async () => {
    await user(a);
    const estimate = await scalar(
      `select create_estimate('${orgA}','${customerA}','Cleanup',25000,current_date+10,'') id`,
    );
    const first = await scalar(
      `select convert_estimate('${estimate}',current_date+1,'09:00') id`,
    );
    const second = await scalar(
      `select convert_estimate('${estimate}',current_date+1,'09:00') id`,
    );
    expect(first).toBe(second);
  });
  it("generates recurring dates idempotently", async () => {
    await user(a);
    const job = await scalar(
      `insert into jobs(organization_id,customer_id,description,scheduled_date,quoted_cents) values('${orgA}','${customerA}','Recurring',current_date,10000) returning id`,
    );
    await db.exec(
      `select make_recurring('${job}','weekly');reset role;select generate_recurring(current_date+21);`,
    );
    const first = (await db.query("select * from jobs")).rows.length;
    await db.exec(`select generate_recurring(current_date+21)`);
    expect((await db.query("select * from jobs")).rows.length).toBe(first);
    expect(first).toBeGreaterThan(3);
  });
  it("rejects inserted completed jobs and locks currency after records exist", async () => {
    await user(a);
    await expect(
      db.exec(
        `insert into jobs(organization_id,customer_id,description,scheduled_date,quoted_cents,status) values('${orgA}','${customerA}','Forged final',current_date,1,'completed')`,
      ),
    ).rejects.toThrow(/must begin/);
    await expect(
      db.exec(`update organizations set currency='EUR' where id='${orgA}'`),
    ).rejects.toThrow(/Currency is locked/);
  });
  it("retains expense changes in immutable audit events", async () => {
    await user(a);
    const id = await scalar(
      `insert into expenses(organization_id,job_id,vendor,category,amount_cents,expense_date) values('${orgA}','${jobA}','Fuel','fuel',1000,current_date) returning id`,
    );
    await db.exec(`update expenses set amount_cents=1250 where id='${id}'`);
    const audit = await db.query<{
      details: { old_amount_cents: number; new_amount_cents: number };
    }>(
      `select details from audit_events where record_id='${id}' and event='expenses.update'`,
    );
    expect(audit.rows[0].details.old_amount_cents).toBe(1000);
    expect(audit.rows[0].details.new_amount_cents).toBe(1250);
    await expect(
      db.exec(
        `insert into audit_events(organization_id,event) values('${orgA}','forged')`,
      ),
    ).rejects.toThrow(/row-level security|permission denied/g);
  });
  it("requires non-expired verified billing even for active status", async () => {
    await db.exec(
      `reset role;update subscriptions set period_end=now()-interval '1 second' where organization_id='${orgA}';`,
    );
    await user(a);
    expect(
      (await db.query<{ ok: boolean }>(`select has_pro('${orgA}') ok`)).rows[0]
        .ok,
    ).toBe(false);
    await expect(
      db.exec(
        `select create_estimate('${orgA}','${customerA}','Denied',100,current_date,'')`,
      ),
    ).rejects.toThrow(/Pro plan/);
    await db.exec(
      `reset role;update subscriptions set period_end=now()+interval '1 month',verified_at=null where organization_id='${orgA}'`,
    );
    await user(a);
    expect(
      (await db.query<{ ok: boolean }>(`select has_pro('${orgA}') ok`)).rows[0]
        .ok,
    ).toBe(false);
  });
  it("persists billing events exactly once and rejects stale state", async () => {
    await db.exec(
      `reset role;update subscriptions set stripe_customer_id='cus_test' where organization_id='${orgA}';select apply_billing_event('evt_new',200,'${orgA}','cus_test','sub_test','active','price_test',now()+interval '1 month');select apply_billing_event('evt_new',200,'${orgA}','cus_test','sub_test','canceled','price_test',now()+interval '1 month');select apply_billing_event('evt_old',100,'${orgA}','cus_test','sub_test','canceled','price_test',now()+interval '1 month');`,
    );
    expect(
      (
        await db.query<{ status: string }>(
          `select status from subscriptions where organization_id='${orgA}'`,
        )
      ).rows[0].status,
    ).toBe("active");
    expect(
      (await db.query(`select * from billing_events where event_id='evt_new'`))
        .rows,
    ).toHaveLength(1);
    await user(a);
    await expect(
      db.exec(
        `select apply_billing_event('evt_forge',300,'${orgA}','cus_test','sub_test','active','price_test',now()+interval '1 month')`,
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("keeps request limits and cron execution private", async () => {
    await user(a);
    await expect(
      db.exec(`select limit_request('forge',10,60)`),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.exec(`select generate_recurring(current_date+1)`),
    ).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
    expect(
      (await db.query<{ ok: boolean }>(`select limit_request('test',1,60) ok`))
        .rows[0].ok,
    ).toBe(true);
    expect(
      (await db.query<{ ok: boolean }>(`select limit_request('test',1,60) ok`))
        .rows[0].ok,
    ).toBe(false);
  });
  it("creates multi-line invoices atomically with exact totals and retry protection", async () => {
    await user(a);
    const items = JSON.stringify([
      { description: "Mowing", quantity_milli: 1500, unit_cents: 8001 },
      { description: "Supplies", quantity_milli: 2125, unit_cents: 350 },
    ]);
    const request = "00000000-0000-4000-8000-000000000201";
    const query = `select create_invoice_with_items('${orgA}','${customerA}',null,'${items}'::jsonb,825,current_date,'Multi-line test','${request}') id`;
    const id = await scalar(query);
    expect(await scalar(query)).toBe(id);
    const lines = await db.query(
      `select * from invoice_items where invoice_id='${id}'`,
    );
    expect(lines.rows).toHaveLength(2);
    expect(
      Number(
        (
          await db.query<{ total: string }>(
            `select invoice_total('${id}') total`,
          )
        ).rows[0].total,
      ),
    ).toBe(13798);
    await expect(
      db.exec(
        `select create_invoice_with_items('${orgA}','${customerA}',null,'${items}'::jsonb,0,current_date,'Changed details','${request}')`,
      ),
    ).rejects.toThrow(/different details/);
  });
  it("rejects malformed item batches without leaving partial invoices", async () => {
    await user(a);
    const before = (await db.query("select * from invoices")).rows.length;
    for (const items of [
      [],
      [{ description: "Bad", quantity_milli: 1000.5, unit_cents: 100 }],
      [{ description: "Bad", quantity_milli: 1000, unit_cents: -1 }],
    ]) {
      await expect(
        db.exec(
          `select create_invoice_with_items('${orgA}','${customerA}',null,'${JSON.stringify(items)}'::jsonb,0,current_date,'',gen_random_uuid())`,
        ),
      ).rejects.toThrow();
    }
    expect((await db.query("select * from invoices")).rows).toHaveLength(
      before,
    );
  });
  it("converts multi-line estimates without dropping fractional item amounts", async () => {
    await user(a);
    const items = JSON.stringify([
      { description: "Cleanup", quantity_milli: 1500, unit_cents: 10001 },
      { description: "Disposal", quantity_milli: 1000, unit_cents: 2500 },
    ]);
    const request = "00000000-0000-4000-8000-000000000202";
    const query = `select create_estimate_with_items('${orgA}','${customerA}','Full cleanup','${items}'::jsonb,current_date+10,'','${request}') id`;
    const id = await scalar(query);
    expect(await scalar(query)).toBe(id);
    const job = await scalar(
      `select convert_estimate('${id}',current_date+2,'11:00') id`,
    );
    expect(
      Number(
        (
          await db.query<{ amount: string }>(
            `select quoted_cents amount from jobs where id='${job}'`,
          )
        ).rows[0].amount,
      ),
    ).toBe(17502);
  });
});
