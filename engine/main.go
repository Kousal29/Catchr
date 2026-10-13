package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Load env from the current directory
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on system env vars")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL is not set")
	}
	log.Printf("DEBUG: Read DATABASE_URL = %s", dbUrl)

	// Initialize DB connection pool config
	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v\n", err)
	}

	// Disable prepared statements for PgBouncer transaction mode
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	db, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()
	log.Println("Connected to Supabase PostgreSQL")

	// Set up graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigs
		log.Println("Shutting down engine...")
		cancel()
	}()

	log.Println("Catchr Engine Started. Polling every 1 minute...")

	// Polling loop
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	// Initial run
	processReminders(ctx, db)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			processReminders(ctx, db)
		}
	}
}
