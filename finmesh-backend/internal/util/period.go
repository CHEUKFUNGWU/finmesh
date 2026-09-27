package util

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var yearRegex = regexp.MustCompile(`^\d{4}$`)

// ParsePeriod converts standardized financial periods (YYYY-Q[1-4], YYYY-MM, or YYYY) into start and end date strings.
func ParsePeriod(period string) (startDate, endDate string, err error) {
	period = strings.TrimSpace(strings.ToUpper(period))
	switch {
	case strings.HasSuffix(period, "-Q1"):
		year := strings.TrimSuffix(period, "-Q1")
		if !yearRegex.MatchString(year) {
			return "", "", fmt.Errorf("invalid year in period: %s", period)
		}
		return year + "-01-01", year + "-03-31", nil
	case strings.HasSuffix(period, "-Q2"):
		year := strings.TrimSuffix(period, "-Q2")
		if !yearRegex.MatchString(year) {
			return "", "", fmt.Errorf("invalid year in period: %s", period)
		}
		return year + "-04-01", year + "-06-30", nil
	case strings.HasSuffix(period, "-Q3"):
		year := strings.TrimSuffix(period, "-Q3")
		if !yearRegex.MatchString(year) {
			return "", "", fmt.Errorf("invalid year in period: %s", period)
		}
		return year + "-07-01", year + "-09-30", nil
	case strings.HasSuffix(period, "-Q4"):
		year := strings.TrimSuffix(period, "-Q4")
		if !yearRegex.MatchString(year) {
			return "", "", fmt.Errorf("invalid year in period: %s", period)
		}
		return year + "-10-01", year + "-12-31", nil
	case len(period) == 7 && period[4] == '-': // YYYY-MM
		parts := strings.Split(period, "-")
		y, errY := strconv.Atoi(parts[0])
		m, errM := strconv.Atoi(parts[1])
		if errY != nil || errM != nil || m < 1 || m > 12 {
			return "", "", fmt.Errorf("invalid YYYY-MM period: %s", period)
		}
		lastDay := time.Date(y, time.Month(m+1), 0, 0, 0, 0, 0, time.UTC).Day()
		return fmt.Sprintf("%04d-%02d-01", y, m), fmt.Sprintf("%04d-%02d-%02d", y, m, lastDay), nil
	case len(period) == 4: // YYYY
		y, errY := strconv.Atoi(period)
		if errY != nil {
			return "", "", fmt.Errorf("invalid YYYY period: %s", period)
		}
		return fmt.Sprintf("%04d-01-01", y), fmt.Sprintf("%04d-12-31", y), nil
	default:
		return "", "", fmt.Errorf("unrecognized period format '%s' (expected YYYY-Q1, YYYY-MM, or YYYY)", period)
	}
}
