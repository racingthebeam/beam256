package job

import (
	"errors"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

type PackageInput struct {
	App *ft.Goblin
}

func Package(input *PackageInput) ([]byte, error) {
	return nil, errors.New("not implemented")
}
