// Existing gait fixtures inspect poses synchronously; prepare their explicit assets.
// Cold loading and visibility behavior are verified separately in lazy-rigs.test.js.
import {CHARACTER_DESIGNS} from '../../src/character-designs.js';
import {loadSkeletalRig} from '../../src/skeletal-motion.js';
await Promise.all(CHARACTER_DESIGNS.flatMap(({id})=>['explorer','pedestrian'].map(role=>loadSkeletalRig(id,role))));
