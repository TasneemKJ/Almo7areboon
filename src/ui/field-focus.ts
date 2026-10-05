/** Hide a contextual surface without stranding its native keyboard owner.
 * An unrelated modal keeps focus; inert/hidden scene origins are never focused. */
export function releaseFieldContext(context:HTMLElement,origin:HTMLElement|null,fallback:HTMLElement):void {
 const held=context.contains(context.ownerDocument.activeElement);
 context.hidden=true;
 if(!held)return;
 const usable=(node:HTMLElement|null)=>!!node?.isConnected&&!node.hidden&&!node.closest('[hidden],[inert]')&&node.getClientRects().length>0;
 if(usable(origin))origin!.focus({preventScroll:true});
 else if(usable(fallback))fallback.focus({preventScroll:true});
}
