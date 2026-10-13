package main

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		fmt.Println("DATABASE_URL is not set")
		return
	}

	u, err := url.Parse(databaseURL)
	if err != nil {
		fmt.Printf("Invalid DATABASE_URL: %v\n", err)
		return
	}

	fmt.Println("Testing Supabase connection...")
	fmt.Printf("Host: %s\n", u.Host)
	fmt.Printf("User: %s\n", u.User.Username())
	fmt.Printf("Database: %s\n", u.Path)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, databaseURL)
	if err != nil {
		fmt.Printf("\nCONNECTION FAILED:\n%v\n", err)
		return
	}
	defer conn.Close(context.Background())

	var result string

	err = conn.QueryRow(
		ctx,
		"SELECT current_user || ' / ' || current_database()",
	).Scan(&result)

	if err != nil {
		fmt.Printf("\nQUERY FAILED:\n%v\n", err)
		return
	}

	fmt.Printf("\nSUCCESS!\nConnected as: %s\n", result)
}