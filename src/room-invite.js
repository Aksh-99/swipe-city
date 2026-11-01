// A missing room must not remain in the invite URL and be retried on reload.
export function withoutUnavailableRoom(href,roomCode){const url=new URL(href);if(url.searchParams.get('room')===roomCode)url.searchParams.delete('room');return url.href;}
