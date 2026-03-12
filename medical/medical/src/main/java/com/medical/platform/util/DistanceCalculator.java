package com.medical.platform.util;

import org.springframework.stereotype.Component;

/**
 * Utility class for calculating distances between two geographical points
 * using the Haversine formula for great-circle distance calculations.
 */
@Component
public class DistanceCalculator {
    
    /**
     * Earth's radius in kilometers
     */
    private static final double EARTH_RADIUS_KM = 6371.0;
    
    /**
     * Calculate the distance between two geographical points using Haversine formula.
     * 
     * @param lat1 Latitude of the first point
     * @param lon1 Longitude of the first point
     * @param lat2 Latitude of the second point
     * @param lon2 Longitude of the second point
     * @return Distance in kilometers
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Convert latitude and longitude from degrees to radians
        double lat1Rad = Math.toRadians(lat1);
        double lat2Rad = Math.toRadians(lat2);
        double deltaLatRad = Math.toRadians(lat2 - lat1);
        double deltaLonRad = Math.toRadians(lon2 - lon1);
        
        // Haversine formula
        double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        // Calculate distance in kilometers
        return EARTH_RADIUS_KM * c;
    }
    
    /**
     * Calculate distance and return rounded to 2 decimal places.
     * 
     * @param lat1 Latitude of the first point
     * @param lon1 Longitude of the first point
     * @param lat2 Latitude of the second point
     * @param lon2 Longitude of the second point
     * @return Distance in kilometers, rounded to 2 decimal places
     */
    public double calculateDistanceRounded(double lat1, double lon1, double lat2, double lon2) {
        double distance = calculateDistance(lat1, lon1, lat2, lon2);
        return Math.round(distance * 100.0) / 100.0;
    }
}
