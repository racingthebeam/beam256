package asm

import (
	"encoding/binary"

	"github.com/racingthebeam/beam256/toolchain/internal/util"
)

type sectionWriter struct {
	Name string
	Data []byte
}

func (w *sectionWriter) Len() int {
	return len(w.Data)
}

func (w *sectionWriter) Align(alignment int) {
	bytesToAdd := util.Align(w.Len(), alignment)
	for range bytesToAdd {
		w.Data = append(w.Data, 0)
	}
}

func (w *sectionWriter) WriteZeroes(count int64) {
	w.Data = append(w.Data, make([]byte, count)...)
}

func (w *sectionWriter) WriteBytes(vals []int64) error {
	newData := make([]byte, len(vals))
	for i, v := range vals {
		newData[i] = uint8(v)
	}
	w.Data = append(w.Data, newData...)
	return nil
}

func (w *sectionWriter) WriteHalfWords(vals []int64) error {
	newData := make([]byte, len(vals)*2)
	wp := 0
	for _, v := range vals {
		binary.LittleEndian.PutUint16(newData[wp:], uint16(v))
		wp += 2
	}
	w.Data = append(w.Data, newData...)
	return nil
}

func (w *sectionWriter) WriteWords(vals []int64) error {
	newData := make([]byte, len(vals)*4)
	wp := 0
	for _, v := range vals {
		binary.LittleEndian.PutUint32(newData[wp:], uint32(v))
		wp += 4
	}
	w.Data = append(w.Data, newData...)
	return nil
}

func (w *sectionWriter) PatchInstruction(offset int, ins uint32) {
	binary.LittleEndian.PutUint32(w.Data[offset:], ins)
}

func (w *sectionWriter) WriteInstruction(ins uint32) {
	offset := w.Len()
	w.Data = append(w.Data, 0, 0, 0, 0)
	w.PatchInstruction(offset, ins)
}
