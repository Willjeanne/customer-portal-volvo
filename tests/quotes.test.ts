import test from "node:test";
import assert from "node:assert/strict";
import { listBuyerQuotes } from "../src/server/account";
import { quoteDate } from "../src/domain/quotes";
import { makePreviewContext } from "../src/domain/fixtures";
test("quote filters use native names, escaped labels and shopper authorization",async t=>{
 const context=makePreviewContext("buyer");context.mode="vtex";
 const session={context,expiresAt:Date.now()+10000,upstreamCookies:"VtexIdclientAutCookie_volvoemea=test"};
 t.mock.method(globalThis,"fetch",async (url:string,init:RequestInit)=>{
  const parsed=new URL(url);assert.equal(parsed.pathname,"/api/quoting/quotes");assert.equal(parsed.searchParams.get("pageNumber"),"2");assert.equal(parsed.searchParams.get("status"),"Approved");assert.equal(parsed.searchParams.get("label"),"Fleet & parts");assert.equal(init.cache,"no-store");assert.ok(new Headers(init.headers).get("Cookie"));
  return Response.json({items:[{id:"q1",status:"Approved",createdAt:"2026-09-19",amount:125.50}],pageNumber:2,pageSize:10,totalItems:11});
 });
 assert.equal((await listBuyerQuotes(session,{page:2,status:"Approved",label:"Fleet & parts"})).items[0].amount,125.50);
 await assert.rejects(listBuyerQuotes(session,{page:0}));await assert.rejects(listBuyerQuotes(session,{page:1,status:"invented"}));
 assert.equal(quoteDate("invalid"),"Not provided");
});
