# Teacher Workspace Activity Rail Alignment Design

## Goal

On desktop layouts, extend the two right-side cards so their combined bottom edge aligns with the bottom of the left sidebar teacher profile, while centering the cards' visible content. Preserve natural-height stacking on mobile.

## Approved Approach

Use the workspace shell's remaining viewport height as the content area's minimum height. Make the desktop content row stretch to fill that space, then make the activity rail a two-row grid whose cards share the available height equally. Center each card's internal content both horizontally and vertically, while keeping queue item labels readable and centered.

## Responsive Behavior

- At `xl` desktop widths, the activity rail is a two-row grid and fills the content row height.
- The main content row has a viewport-relative minimum height that accounts for page padding, the context bar, and the gap above the row.
- Below `xl`, the existing horizontal/tablet behavior is retained without forced full-height cards.
- On mobile, cards return to natural content height and stack vertically.

## Files

- `src/components/WorkspaceScreen.tsx`: add the content-row layout hook.
- `src/components/workspace/WorkspaceActivityRail.tsx`: add centered card structure hooks.
- `src/styles/theme.css`: implement desktop fill, equal-height rows, and centered card contents.
- `src/components/WorkspaceScreen.test.tsx`: assert the intended layout hooks are present.

## Success Criteria

1. At desktop width, the right rail reaches the same visual bottom line as the sidebar teacher profile/page content area.
2. The two right cards divide the available height evenly.
3. Headings, metadata, queue labels, icons, pulse grid, and explanatory copy are centered within their cards.
4. Mobile cards remain naturally sized and usable.
5. Existing workspace tests and production build pass.
