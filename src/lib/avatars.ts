import cg1 from "@/assets/avatars/cg-1.jpg";
import cg2 from "@/assets/avatars/cg-2.jpg";
import cg3 from "@/assets/avatars/cg-3.jpg";
import cg4 from "@/assets/avatars/cg-4.jpg";
import cg5 from "@/assets/avatars/cg-5.jpg";
import cr1 from "@/assets/avatars/cr-1.jpg";
import cr2 from "@/assets/avatars/cr-2.jpg";
import cr3 from "@/assets/avatars/cr-3.jpg";
import cr4 from "@/assets/avatars/cr-4.jpg";
import cr5 from "@/assets/avatars/cr-5.jpg";

const cgAvatars = [cg1, cg2, cg3, cg4, cg5];
const crAvatars = [cr1, cr2, cr3, cr4, cr5];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getCareGiverAvatar(id: string): string {
  return cgAvatars[hashStr(id) % cgAvatars.length];
}

export function getCareReceiverAvatar(id: string): string {
  return crAvatars[hashStr(id) % crAvatars.length];
}
