#include "beam256/internals.h"

WORD bif_test(WORD *args, int nargs) {
    WORD res = 0;
    for (int i = 0; i < nargs; i++) {
        res += args[i];
    }
    return res;
}

bif_fn bif_table[BIF_MAX] = {
    bif_test,
};
