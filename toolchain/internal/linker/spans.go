package linker

import (
	"container/list"
)

type spans struct {
	Size int

	lst list.List
}

type span struct {
	Start, End int
}

func (s span) Overlaps(other span) bool {
	return other.End > s.Start && other.Start < s.End
}

// TODO: have this return a detailed on failure
func (s *spans) AddInterval(start, length int) bool {
	if length == 0 {
		return true
	}

	end := start + length

	if end > s.Size {
		return false
	}

	if s.lst.Len() == 0 {
		s.lst.PushBack(span{start, end})
		return true
	}

	curr := s.lst.Front()
	for curr != nil {
		if start <= _s(curr).Start {
			return s.insert(curr, span{start, end})
		}
		curr = curr.Next()
	}

	if _s(s.lst.Back()).Overlaps(span{start, end}) {
		return false
	}

	s.lst.PushBack(span{start, end})
	return true
}

func (s *spans) insert(mark *list.Element, ns span) bool {
	p := mark.Prev()
	if p != nil && _s(p).Overlaps(ns) {
		return false
	}

	if _s(mark).Overlaps(ns) {
		return false
	}

	s.lst.InsertBefore(ns, mark)
	return true
}

func _s(curr *list.Element) span {
	return curr.Value.(span)
}
