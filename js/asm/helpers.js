export function roundUpToNextMultipleOf(x, n) {
    // probably a better way to do this if you assume powers of 2?
    // but... our .align directive doesn't mandate this.
    const rem = x % n;
    if (rem === 0) return x;
    return x + (n - rem);
}

