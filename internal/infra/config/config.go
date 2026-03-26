// Copyright The MatrixHub Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"

	"github.com/matrixhub-ai/matrixhub/internal/infra/db"
	"github.com/matrixhub-ai/matrixhub/internal/infra/log"
)

type Config struct {
	Debug         bool             `yaml:"debug"`
	Log           log.Config       `yaml:"log"`
	APIServer     *APIServerConfig `yaml:"apiServer" validate:"required"`
	UI            UIConfig         `yaml:"ui"`
	MigrationPath string           `yaml:"migrationPath" validate:"required"`

	DataDir string `yaml:"dataDir" validate:"required"`

	Database db.Config `yaml:"database" validate:"required"`
}

type APIServerConfig struct {
	Port int `yaml:"port" validate:"required"`
}

type UIConfig struct {
	StaticDir string `yaml:"staticDir"`
}

func Init(configPath, sqlPath string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(configPath)

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to load config(%s): %w", configPath, err)
	}

	// v.SetEnvPrefix("MATRIXHUB")
	// v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	// v.AutomaticEnv()

	// Allow env overrides (viper will use these when present)
	_ = v.BindEnv("database.dsn", db.MATRIXHUB_DSN_ENV)

	cfg := new(Config)
	if err := v.Unmarshal(cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	if cfg.Database.DSN == "" {
		log.Warn("failed to find matrixhub dsn from env or config")
	}

	if cfg.DataDir == "" {
		log.Warn("dataDir is not set, using default ./data")
		cfg.DataDir = "./data"
	}

	err := os.MkdirAll(cfg.DataDir, os.ModePerm)
	if err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	if cfg.Database.Migrate {
		cfg.Database.SQLPath = filepath.Join(cfg.MigrationPath, sqlPath)
	}
	cfg.Database.Debug = cfg.Debug

	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("config invalid: %v", err)
	}

	return cfg, nil
}

func (config *Config) Validate() error {
	fileInfo, err := os.Stat(config.MigrationPath)
	if err != nil {
		return err
	}
	if !fileInfo.IsDir() {
		return fmt.Errorf("%s is not dir", fileInfo.Name())
	}

	return nil
}
