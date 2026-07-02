// url=https://www.figma.com/design/7n5gop02bowp2dRKTNOxOD/🚀+Components?node-id=65213-2243
// source=src/components/iterations/iteration-2/Drawer.tsx
// component=Drawer
import figma from "figma";
const instance = figma.selectedInstance;

const titleNode = instance.findText("✏️ title", { traverseInstances: true });
const title = titleNode && titleNode.type === "TEXT" ? titleNode.textContent : "";
const content = instance.getSlot("content");

// hasFooter / footer (Sticky Bar with startButton + endButton) has no reliable
// 1:1 code mapping — Drawer's `footer` prop takes arbitrary ReactNode, and the
// Sticky Bar's buttons aren't themselves Code Connect-ed. Omitted rather than
// fabricated; pass `footer` manually when the design calls for one.
export default {
  example: figma.code`
    <Drawer open onClose={() => setOpen(false)} title="${title}">
      ${content}
    </Drawer>
  `,
  imports: ['import { Drawer } from "@/components/iterations/iteration-2/Drawer"'],
  id: "drawer",
  metadata: { nestable: true },
};
