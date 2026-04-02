package asm

import "path"

type fileStack struct {
	entries []fileStackEnt
}

type fileStackEnt struct {
	AbsName   string
	OptsStack []CompileOpts
}

func (e *fileStackEnt) Opts() *CompileOpts { return &e.OptsStack[len(e.OptsStack)-1] }
func (e *fileStackEnt) PushOpt()           { e.OptsStack = append(e.OptsStack, e.Opts().Dup()) }
func (e *fileStackEnt) PopOpt()            { e.OptsStack = e.OptsStack[0 : len(e.OptsStack)-1] }

func newFileStack(defaultOpts CompileOpts) *fileStack {
	return &fileStack{
		entries: []fileStackEnt{
			{
				AbsName:   "<root>",
				OptsStack: []CompileOpts{defaultOpts},
			},
		},
	}
}

func (s *fileStack) Push(filename string) {
	s.entries = append(s.entries, fileStackEnt{
		AbsName:   filename,
		OptsStack: []CompileOpts{*s.ent().Opts()},
	})
}

func (s *fileStack) Pop() {
	s.entries = s.entries[0 : len(s.entries)-1]
}

func (s *fileStack) ResolvePath(filename string) string {
	return resolveFilename(s.Filename(), filename)
}

func (s *fileStack) Filename() string { return s.ent().AbsName }

func (s *fileStack) Opts() *CompileOpts { return s.ent().Opts() }
func (s *fileStack) PushOpt()           { s.ent().PushOpt() }
func (s *fileStack) PopOpt()            { s.ent().PopOpt() }

func (s *fileStack) ent() *fileStackEnt { return &s.entries[len(s.entries)-1] }

func resolveFilename(relativeTo string, name string) string {
	if name[0] == '/' {
		return name[1:]
	} else if name[0] != '.' {
		return name
	}

	return path.Clean(path.Join(path.Dir(relativeTo), name))
}
