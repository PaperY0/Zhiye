# Teacher Workspace Recap Stage Reflow Design

## Goal

Rebalance the central lesson stage so the recap card fills the unused middle space, its learning content is centered, and the three supporting insights sit at the stage bottom aligned with the teacher profile baseline.

## Approved Layout

Use a three-part vertical composition on desktop:

1. Compact lesson heading and progress timeline.
2. A flexible recap card that consumes remaining height.
3. A bottom information dock containing recent lesson, preparation suggestion, and class change.

The recap card keeps the AI status near the top and actions at the bottom. Only the learning-content group (label, summary, and tags) is centered horizontally and vertically. The bottom dock remains in normal document flow; no absolute positioning is used.

## Responsive Behavior

- At `xl` desktop widths, the lesson stage fills the content row height and uses a vertical flex/grid allocation.
- The recap card grows into remaining space with `min-height: 0` safeguards.
- The bottom information dock is the final stage child and is pushed to the bottom.
- Below desktop widths, the stage and recap card return to natural height; content remains usable without forced viewport filling.

## Success Criteria

1. The feedback dock bottom aligns within 0–2px of the sidebar teacher profile bottom at desktop size.
2. The recap card is visibly taller and occupies the previous empty middle space.
3. Recap label, core sentence, and tags are centered.
4. AI status and bottom actions retain clear edge alignment.
5. Mobile uses natural heights and does not overflow.
