/** Hide a contextual surface without stranding its native keyboard owner.
 * An unrelated modal keeps focus; inert/hidden scene origins are never focused. */
const usable=(node:HTMLElement|null)=>!!node?.isConnected&&!node.hidden&&!node.closest('[hidden],[inert]')&&node.getClientRects().length>0;

export function releaseFieldContext(context:HTMLElement,origin:HTMLElement|null,fallback:HTMLElement):void {
 const held=context.contains(context.ownerDocument.activeElement);
 context.hidden=true;
 if(!held)return;
 if(usable(origin))origin!.focus({preventScroll:true});
 else if(usable(fallback))fallback.focus({preventScroll:true});
}

/** Capture origin focus before hidden can make the browser drop it to body. */
export function hideFieldTarget(target:HTMLElement,hidden:boolean,fallback:HTMLElement):void {
 const document=target.ownerDocument,held=document.activeElement===target;
 target.hidden=hidden;
 if(!hidden||!held)return;
 const active=document.activeElement;
 if(active&&active!==target&&active!==document.body)return;
 if(usable(fallback))fallback.focus({preventScroll:true});
}
