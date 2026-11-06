/** Joint-angle rep logic. A rep counts only after a full, correct range of motion. */

const IDX = {
    lShoulder: 11, rShoulder: 12,
    lElbow: 13, rElbow: 14,
    lWrist: 15, rWrist: 16,
    lHip: 23, rHip: 24,
    lKnee: 25, rKnee: 26,
    lAnkle: 27, rAnkle: 28,
};

export function createRepTracker() {
    return {
        phase: 'up',
        reachedDepth: false,
        lastRepAt: 0,
        goodHoldMs: 0,
        lastTick: 0,
        leftHigh: false,
        rightHigh: false,
    };
}

function visible(point) {
    return point && (point.visibility ?? 1) >= 0.5;
}

function jointAngle(a, b, c) {
    const abx = a.x - b.x;
    const aby = a.y - b.y;
    const cbx = c.x - b.x;
    const cby = c.y - b.y;
    const dot = abx * cbx + aby * cby;
    const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
    if (!mag) return null;
    return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

function meanAngle(landmarks, triples) {
    const values = [];
    triples.forEach(([i, j, k]) => {
        const a = landmarks[i];
        const b = landmarks[j];
        const c = landmarks[k];
        if (!visible(a) || !visible(b) || !visible(c)) return;
        const value = jointAngle(a, b, c);
        if (value != null) values.push(value);
    });
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function movementFamily(name = '') {
    const q = name.toLowerCase();
    if (/plank|bear/.test(q)) return 'plank';
    if (/push|pike|burpee/.test(q)) return 'pushup';
    if (/bridge|glute|cobra|superman/.test(q)) return 'hinge';
    if (/crunch|twist|bicycle/.test(q)) return 'crunch';
    if (/knee|climber|calf/.test(q)) return 'knee';
    if (/lunge|squat/.test(q)) return 'squat';
    if (/stretch|child|hamstring/.test(q)) return 'hinge';
    return 'squat';
}

function miss(feedback) {
    return { counted: false, feedback, formScore: 40 };
}

function finishRep(tracker, now, feedback, formScore) {
    tracker.phase = 'up';
    tracker.reachedDepth = false;
    tracker.lastRepAt = now;
    return { counted: true, feedback, formScore };
}

function evaluateSquat(lm, tracker, now) {
    const knee = meanAngle(lm, [
        [IDX.lHip, IDX.lKnee, IDX.lAnkle],
        [IDX.rHip, IDX.rKnee, IDX.rAnkle],
    ]);
    if (knee == null) return miss('Show both legs so the squat can be checked');

    const leftDrift = visible(lm[IDX.lKnee]) && visible(lm[IDX.lAnkle])
        ? Math.abs(lm[IDX.lKnee].x - lm[IDX.lAnkle].x) : 0;
    const rightDrift = visible(lm[IDX.rKnee]) && visible(lm[IDX.rAnkle])
        ? Math.abs(lm[IDX.rKnee].x - lm[IDX.rAnkle].x) : 0;
    const kneesAligned = leftDrift < 0.14 && rightDrift < 0.14;

    if (knee < 125) {
        tracker.phase = 'down';
        if (knee < 112) tracker.reachedDepth = true;
        if (!kneesAligned) return { counted: false, feedback: 'Knees are caving — keep them over the feet', formScore: 48 };
        return { counted: false, feedback: 'Good depth — stand all the way up to count the rep', formScore: 82 };
    }

    if (knee > 155 && tracker.phase === 'down') {
        if (!tracker.reachedDepth) {
            tracker.phase = 'up';
            return { counted: false, feedback: 'That squat was too shallow to count', formScore: 52 };
        }
        if (!kneesAligned) {
            tracker.phase = 'up';
            tracker.reachedDepth = false;
            return { counted: false, feedback: 'Rep not counted — knees drifted inward', formScore: 46 };
        }
        if (now - tracker.lastRepAt < 800) return { counted: false, feedback: 'Stand tall between reps', formScore: 80 };
        return finishRep(tracker, now, 'Squat counted — full depth and knees aligned', 94);
    }

    return { counted: false, feedback: tracker.phase === 'down' ? 'Drive up through the heels' : 'Sit the hips back and bend the knees', formScore: 70 };
}

function evaluatePushup(lm, tracker, now) {
    const elbow = meanAngle(lm, [
        [IDX.lShoulder, IDX.lElbow, IDX.lWrist],
        [IDX.rShoulder, IDX.rElbow, IDX.rWrist],
    ]);
    const torso = meanAngle(lm, [
        [IDX.lShoulder, IDX.lHip, IDX.lAnkle],
        [IDX.rShoulder, IDX.rHip, IDX.rAnkle],
    ]);
    if (elbow == null) return miss('Show both arms so the push-up can be checked');

    const straight = torso == null || torso > 150;

    if (elbow < 100) {
        tracker.phase = 'down';
        if (elbow < 90 && straight) tracker.reachedDepth = true;
        if (!straight) return { counted: false, feedback: 'Hips are sagging — hold a straight line', formScore: 45 };
        return { counted: false, feedback: 'Chest is low — press back up to count', formScore: 84 };
    }

    if (elbow > 155 && tracker.phase === 'down') {
        if (!tracker.reachedDepth || !straight) {
            tracker.phase = 'up';
            tracker.reachedDepth = false;
            return { counted: false, feedback: 'Rep not counted — bend the elbows more and keep the body straight', formScore: 50 };
        }
        if (now - tracker.lastRepAt < 800) return { counted: false, feedback: 'Lock out, then lower again', formScore: 80 };
        return finishRep(tracker, now, 'Push-up counted — full bend and a straight body', 93);
    }

    return { counted: false, feedback: 'Lower until the elbows pass a right angle', formScore: 72 };
}

function evaluatePlank(lm, tracker, now) {
    const torso = meanAngle(lm, [
        [IDX.lShoulder, IDX.lHip, IDX.lAnkle],
        [IDX.rShoulder, IDX.rHip, IDX.rAnkle],
    ]);
    if (torso == null) return miss('Show your full side line for the plank');
    if (torso < 155) {
        tracker.goodHoldMs = 0;
        tracker.lastTick = now;
        return { counted: false, feedback: 'Plank not counting — lift the hips into a straight line', formScore: 42 };
    }

    if (!tracker.lastTick) tracker.lastTick = now;
    tracker.goodHoldMs += now - tracker.lastTick;
    tracker.lastTick = now;
    if (tracker.goodHoldMs >= 1000) {
        tracker.goodHoldMs = 0;
        tracker.lastRepAt = now;
        return { counted: true, feedback: 'Straight plank — one second counted', formScore: 95 };
    }
    return { counted: false, feedback: 'Hold the straight plank', formScore: 90 };
}

function evaluateHinge(lm, tracker, now) {
    const hip = meanAngle(lm, [
        [IDX.lShoulder, IDX.lHip, IDX.lKnee],
        [IDX.rShoulder, IDX.rHip, IDX.rKnee],
    ]);
    if (hip == null) return miss('Show hips and shoulders for this movement');

    if (hip < 130) {
        tracker.phase = 'down';
        tracker.reachedDepth = true;
        return { counted: false, feedback: 'Lift the hips to finish the rep', formScore: 78 };
    }
    if (hip > 160 && tracker.phase === 'down' && tracker.reachedDepth) {
        if (now - tracker.lastRepAt < 800) return { counted: false, feedback: 'Squeeze and lower with control', formScore: 82 };
        return finishRep(tracker, now, 'Rep counted — hips fully extended', 92);
    }
    return { counted: false, feedback: 'Lower the hips, then extend fully', formScore: 70 };
}

function evaluateCrunch(lm, tracker, now) {
    const torso = meanAngle(lm, [
        [IDX.lShoulder, IDX.lHip, IDX.lKnee],
        [IDX.rShoulder, IDX.rHip, IDX.rKnee],
    ]);
    if (torso == null) return miss('Show your torso so the crunch can be checked');
    if (torso < 115) {
        tracker.phase = 'down';
        tracker.reachedDepth = true;
        return { counted: false, feedback: 'Curl reached — return tall to count', formScore: 84 };
    }
    if (torso > 150 && tracker.phase === 'down' && tracker.reachedDepth) {
        if (now - tracker.lastRepAt < 700) return { counted: false, feedback: 'Control the return', formScore: 80 };
        return finishRep(tracker, now, 'Crunch counted — full curl and return', 91);
    }
    return { counted: false, feedback: 'Curl the ribs toward the hips', formScore: 70 };
}

function evaluateKnee(lm, tracker, now) {
    const checkSide = (kneeI, hipI, flag) => {
        const knee = lm[kneeI];
        const hip = lm[hipI];
        if (!visible(knee) || !visible(hip)) return false;
        const high = knee.y < hip.y + 0.02;
        if (high && !tracker[flag]) {
            tracker[flag] = true;
            return true;
        }
        if (!high && knee.y > hip.y + 0.08) tracker[flag] = false;
        return false;
    };

    const left = checkSide(IDX.lKnee, IDX.lHip, 'leftHigh');
    const right = checkSide(IDX.rKnee, IDX.rHip, 'rightHigh');
    if (!visible(lm[IDX.lKnee]) && !visible(lm[IDX.rKnee])) {
        return miss('Show both legs so each knee drive can be checked');
    }
    if ((left || right) && now - tracker.lastRepAt > 450) {
        tracker.lastRepAt = now;
        return { counted: true, feedback: 'Knee reached hip height — rep counted', formScore: 90 };
    }
    return { counted: false, feedback: 'Drive one knee up to hip height, then switch', formScore: 72 };
}

export function evaluatePose(landmarks, exerciseName, tracker, now = performance.now()) {
    if (!landmarks || landmarks.length < 29) {
        return miss('Waiting for a clear view of your body');
    }
    const family = movementFamily(exerciseName);
    if (family === 'plank') return evaluatePlank(landmarks, tracker, now);
    if (family === 'pushup') return evaluatePushup(landmarks, tracker, now);
    if (family === 'hinge') return evaluateHinge(landmarks, tracker, now);
    if (family === 'crunch') return evaluateCrunch(landmarks, tracker, now);
    if (family === 'knee') return evaluateKnee(landmarks, tracker, now);
    return evaluateSquat(landmarks, tracker, now);
}
