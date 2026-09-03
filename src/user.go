package src

import "encoding/json"

type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Active   bool   `json:"active"`
}

func (u *User) toJson() (string, error) {
	data, err := json.Marshal(u)
	if err != nil {
		return "", err
	}
	return string(data), nil
}