#define SIGN_EXTEND_8(v) \
    ((v) & 0x80) ? (((WORD)(v)) | 0xFFFFFF00) : ((WORD)(v))

#define SIGN_EXTEND_16(v) \
    ((v) & 0x8000) ? (((WORD)(v)) | 0xFFFF0000) : ((WORD)(v))

