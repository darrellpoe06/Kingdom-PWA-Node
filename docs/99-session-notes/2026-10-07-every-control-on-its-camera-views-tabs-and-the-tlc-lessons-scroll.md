# 2026-10-07 — Every control on its camera, views you order while they stream, tabs, and the TLC lessons scroll

**Layer 4 working note.** Decisions: DR-0783 (the Cameras tab reshaped), DR-0784 (Steps / Scroll on every lesson surface). Pairs with DR-0776 to DR-0782 (the camera day).

## What Darrell said, 8:32 to 8:45 CDT

- *"Better functions more intuitive... why does a user need to scroll down there when each control for each camera should be with it.... also the Wall sucks!!!! My views should be able to have and reorder the view live while it is still actively streaming... review other wyze and camera brands for functions that make sense... not rigid"*
- *"Record should be with the camera you want to do that with"*
- *"Views should be able to drag whichever cameras they want to use... or see 4 with each other or 6... liberation of options.... optimized for the users"*
- *"We also work with tabs... the recordings should be on the recordings tab or something like that.... not below all cameras... scrolling down to see something that could be in the next tab is a real issue with these first builds... we should know better... also the scrolling function should be added to all lessons areas as an option... scrolling is only good when we read lessons"*
- *"Tlctherapysolutions App needs full scrolling for lessons according to the wife... Christina... fix it"*

## What was measured

- The Cameras page: a wall, 31 tiles, then a recorder list of all 31 cameras with their Record switches, then access and setup, all one scroll (his screenshots).
- The wall: one append-only list, one grid shape, no second wall.
- The TLC door's lessons: `PracticeLearn.jsx:687` renders `LessonFlowAudience` with no flow switch; the Steps / Scroll switch of DR-0749 lived only in the Learn guide (`ChurchLearn.jsx`).

## What changed

- `Cameras.jsx`: four tabs inside the tab (Live, Recordings, Who can see, Setup; remembered per device; a grant holder sees Live). Every tile carries Big, + View, Record with keep and the clip count (`TileRecord`, state lifted into `useRecording`), Garage, Why?. Views replace the wall: named, ordered by a drag handle (pointer events) or arrows while the players keep streaming (keyed, no restart), laid out Auto or 1 to 4 across, several at once, the old wall carried over as My view; Rename, Clear and Delete (both ask first).
- `cameras.js`: the views helpers (`loadViews` with the wall migration, `moveInView`, `viewCols`, `indexAtPoint`, and the rest).
- `LessonFlow.jsx`: the Steps / Scroll switch in the flow itself; `ChurchLearn.jsx` opts out because it renders its own.

## Verification

- Camera helpers 72, render 28 (tile Record PUTs the camera; the clip count opens the Recordings tab; + View adds; the arrow reorders with the same `<video>` elements and no new ticket; the layout select changes the columns; a second view; Remove; Clear asks first), UI standards green (destructive buttons ask), lint clean.
- Lesson flow: 4 new cases and the existing flow suites.

## For Darrell and Christina

Cameras: the top row is now Live · Recordings · Who can see · Setup. On Live, every camera has its own Record, + View and Big. Press + View on the cameras you want, then drag the ⠿ handle (or the arrows) to order them while they play, and pick how many across. TLC lessons: a Steps / Scroll pair sits above every lesson; Scroll shows the whole lesson at once and stays chosen on that device.

## Later — click a camera to make it the largest, click again to put it back (DR-0796)

Darrell, Firestick, a view open: *"Clicking inside the image of one camera makes it largest size... click again it goes to the previous position."* The live picture is now a button in a view and in the full-size window: the clicked camera is laid out alone (one column; in the window `fitGrid` for one tile, the bar naming it), the other tiles stay mounted and hidden so their streams keep running, and the second click puts every tile back where it was with no new ticket. Enter from a remote does the same. `cameras.test.js` 77 · `cameras-render.test.jsx` 30.
