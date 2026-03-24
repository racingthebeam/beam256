package linker

type spans struct {
	Size int
}

// TODO: implement this you lazy f'r
func (s *spans) AddInterval(start, length int) bool {
	if start+length > s.Size {
		return false
	}

	return true
}
