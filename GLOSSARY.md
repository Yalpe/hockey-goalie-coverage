# Goalie Coverage

A visualisation of how much of the net a hockey goaltender covers from a given puck position, used by goalie coaches to teach young goalies about angles, stance and hand placement.

## Rink

**Goal Mouth**:
The rectangular opening of the net bounded by the two posts, the crossbar and the ice, lying in the goal-line plane.
_Avoid_: Net face, opening

**Crease**:
The painted area in front of the net where the goaltender sets up.

**Puck**:
The 3-inch-diameter, 1-inch-thick disk whose position is the origin of every shot. Its size is taken into account, not treated as a point.

## Coverage

**Shot Cone**:
The volume containing every straight-line path the puck can take from its position into the Goal Mouth.
_Avoid_: Trajectory, shooting lane

**Coverage Shadow**:
The goalie's silhouette projected onto the Goal Mouth as seen from the Puck, as if the Puck were a light source; the net behind it is covered.
_Avoid_: Projection, cast shadow

**Open Net**:
The part of the Goal Mouth outside the Coverage Shadow: where a straight shot from the Puck can still score.
_Avoid_: Holes, gaps

## Goaltender

**Stance**:
A fixed torso-and-leg posture the goaltender holds; one of Stand-up, Butterfly or RVH.
_Avoid_: Support position, pose

**RVH**:
Reverse-VH: a post-integration Stance. The post-side pad is down on the ice like a butterfly pad, running along the goal line and locked against the post, with the post between the pad and the skate toe. The goaltender sits over the post knee, leaning so the post-side shoulder seals the post; the post-side hand seals the gap beside the hip. The other leg spreads wide, with its skate planted out to the side on its inside edge and its pad facing the shooter. The body is turned about 30° toward the post.

**Glove Hand**:
The catching hand.
_Avoid_: Trapper, catcher

**Blocker Hand**:
The hand wearing the blocker; it holds the stick, which moves with it.
_Avoid_: Stick hand

**Catch Side**:
Which hand the goaltender catches with, left or right; the Blocker Hand is the other.

**Depth**:
How far out the goaltender plays: the distance from the middle of the goal line to the goaltender's toes (skate toes when upright, the front edge of the pad on the ice when kneeling). "Top of the crease" is a Depth equal to the crease radius.
_Avoid_: Distance, gap

## Coaching

**Setup**:
An arrangement of Puck and goaltender (position, facing, Stance, height, Catch Side, hand placement), with an optional name, the view and the display toggles, that a coach can save and share as a link.
_Avoid_: Scenario, preset, drill
