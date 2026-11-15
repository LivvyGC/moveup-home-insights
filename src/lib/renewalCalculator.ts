export interface RenewalInputs {
 currentRent:number; offeredRent:number; months:number;
 alternativeRent:number|null; movingCost:number|null; securityDeposit:number|null;
 homePrice:number|null; downPayment:number|null; aprPercent:number|null;
 loanYears:number; propertyTaxMonthly:number|null; insuranceMonthly:number|null;
 otherMonthly:number|null; closingCost:number|null;
}
export type CostResult={total:number;differenceVsStay:number; upfront:number;source:string};
export type BuyResult=CostResult&{monthlyMortgage:number;principalRepaid:number;interestPaid:number;excludedCosts:string[]};
const round=(x:number)=>Math.round((x+Number.EPSILON)*100)/100;
function valid(n:number|null):n is number{return n!==null&&Number.isFinite(n)&&n>=0;}
export function stayCost(rent:number,months:number):number {
 if(!Number.isFinite(rent)||rent<0||!Number.isInteger(months)||months<1)throw Error("Invalid rent/horizon");
 return round(rent*months);
}
export function mortgageAmortization(principal:number,aprPercent:number,termYears:number,months:number){
 if(!valid(principal)||!valid(aprPercent)||aprPercent>100||![15,20,30].includes(termYears)||!Number.isInteger(months)||months<1)throw Error("Invalid loan");
 const term=termYears*12,rate=aprPercent/1200;
 const payment=principal===0?0:rate===0?principal/term:principal*rate/(1-Math.pow(1+rate,-term));
 let balance=principal, interestPaid=0,principalRepaid=0,totalPayments=0;
 for(let i=0;i<Math.min(months,term);i++){
  const interest=balance*rate;
  const principalPart=Math.min(balance,Math.max(0,payment-interest));
  const actual=principalPart+interest;
  balance-=principalPart;interestPaid+=interest;principalRepaid+=principalPart;totalPayments+=actual;
 }
 // Reconcile after currency rounding without adding or hiding additional costs.
 const total=round(totalPayments),interest=round(interestPaid);
 return {monthlyPayment:round(payment),totalPayments:total,interestPaid:interest,principalRepaid:round(total-interest),
  remainingBalance:round(balance)};
}
export function renewalScenarios(input:RenewalInputs){
 const {months,currentRent,offeredRent}=input;
 const baseline=stayCost(offeredRent,months);
 const stay={total:baseline,differenceVsStay:0,upfront:0,source:"Your offered rent × months"} satisfies CostResult;
 let move:CostResult|null=null;
 if(valid(input.alternativeRent)){
  const moving=valid(input.movingCost)?input.movingCost:0;
  const deposit=valid(input.securityDeposit)?input.securityDeposit:0;
  const total=round(input.alternativeRent*months+moving);
  move={total,differenceVsStay:round(total-baseline),upfront:round(moving+deposit),
   source:"Your alternative rent × months + moving cost; refundable deposit only in upfront"};
 }
 let buy:BuyResult|null=null;
 if(valid(input.homePrice)&&input.homePrice>0&&valid(input.downPayment)&&input.downPayment<=input.homePrice&&
    valid(input.aprPercent)&&input.aprPercent<=100){
  const m=mortgageAmortization(input.homePrice-input.downPayment,input.aprPercent,input.loanYears,months);
  const extras=[input.propertyTaxMonthly,input.insuranceMonthly,input.otherMonthly].map(x=>valid(x)?x:0);
  const closing=valid(input.closingCost)?input.closingCost:0;
  const total=round(m.totalPayments+extras.reduce((a,c)=>a+c,0)*months+closing);
  buy={total,differenceVsStay:round(total-baseline),upfront:round(input.downPayment+closing),
   principalRepaid:m.principalRepaid,interestPaid:m.interestPaid,monthlyMortgage:m.monthlyPayment,
   excludedCosts:[
    ...(input.propertyTaxMonthly===null?["property tax"]:[]),
    ...(input.insuranceMonthly===null?["insurance"]:[]),
    ...(input.otherMonthly===null?["other ownership costs"]:[]),
    ...(input.closingCost===null?["closing costs"]:[])
   ],source:"Your purchase inputs + adjustable mortgage-rate assumption; property taxes/fees only if entered"};
 }
 return {stay,move,buy,renewalDelta:round((offeredRent-currentRent)*months)};
}
export function capScenario(currentRent:number, offeredRent:number, months:number, capRate:number|null){
 if(capRate===null) return null;
 if(!Number.isFinite(capRate)||capRate<0)throw Error("Invalid cap");
 const maxRent=round(currentRent*(1+capRate/100));
 // Do not increase a renter's actual offer to the ceiling.
 const comparedRent=Math.min(maxRent,offeredRent);
 return {maxRent,total:stayCost(comparedRent,months),deltaVsOffer:round(stayCost(comparedRent,months)-stayCost(offeredRent,months))};
}
export function daysOld(observationDate:string,asOf:Date):number{
 const day=Date.parse(observationDate+"T00:00:00Z");
 if(!Number.isFinite(day)) return Number.POSITIVE_INFINITY;
 return Math.floor((asOf.getTime()-day)/86400000);
}
export function isStale(observationDate:string,asOf:Date):boolean{return daysOld(observationDate,asOf)>45;}
