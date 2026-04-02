package mergefs

import (
	"io/fs"
	"os"
	"path/filepath"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/assert"
)

func TestMergeFS(t *testing.T) {

	t.Run("testing different filesystems", func(t *testing.T) {
		a := fstest.MapFS{"a": &fstest.MapFile{Data: []byte("text")}}
		b := fstest.MapFS{"b": &fstest.MapFile{Data: []byte("text")}}
		filesystem := Merge(a, b)

		if _, err := filesystem.Open("a"); err != nil {
			t.Fatalf("file should exist")
		}
		if _, err := filesystem.Open("b"); err != nil {
			t.Fatalf("file should exist")
		}
	})

	var filePaths = []struct {
		path           string
		dirArrayLength int
		child          string
	}{
		// MapFS takes in account the current directory in addition to all included directories and produces a "" dir
		{"a", 1, "z"},
		{"a/z", 1, "bar.cue"},
		{"b", 1, "z"},
		{"b/z", 1, "foo.cue"},
	}

	tempDir := os.DirFS(filepath.Join("testdata"))
	a := fstest.MapFS{
		"a":           &fstest.MapFile{Mode: fs.ModeDir},
		"a/z":         &fstest.MapFile{Mode: fs.ModeDir},
		"a/z/bar.cue": &fstest.MapFile{Data: []byte("bar")},
	}

	filesystem := Merge(tempDir, a)

	t.Run("testing mergefs.ReadDir", func(t *testing.T) {
		for _, fp := range filePaths {
			t.Run("testing path: "+fp.path, func(t *testing.T) {
				dirs, err := fs.ReadDir(filesystem, fp.path)
				assert.NoError(t, err)
				assert.Equal(t, len(dirs), fp.dirArrayLength)

				for i := range dirs {
					assert.Equal(t, dirs[i].Name(), fp.child)
				}
			})
		}
	})

	t.Run("testing mergefs.Open", func(t *testing.T) {
		data := make([]byte, 3)
		file, err := filesystem.Open("a/z/bar.cue")
		assert.NoError(t, err)

		_, err = file.Read(data)
		assert.NoError(t, err)
		assert.Equal(t, "bar", string(data))

		file, err = filesystem.Open("b/z/foo.cue")
		assert.NoError(t, err)

		_, err = file.Read(data)
		assert.NoError(t, err)
		assert.Equal(t, "foo", string(data))

		err = file.Close()
		assert.NoError(t, err)
	})
}
