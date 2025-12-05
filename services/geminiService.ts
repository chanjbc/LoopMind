import { GoogleGenAI, Type } from "@google/genai";
import { Location, OptimizationResult, RoutePlan, RouteStats } from "../types";
import { getRouteForPath } from "./routingService";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const optimizeRoutes = async (
  depot: Location,
  jobs: Location[],
  truckCount: number
): Promise<OptimizationResult> => {
  
  // Prepare the data for the prompt
  const allLocations = [depot, ...jobs];
  const locationListString = allLocations.map((loc, index) => 
    `Index ${index}: ${loc.type} at (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`
  ).join('\n');

  const prompt = `
    I have a Vehicle Routing Problem (VRP).
    
    Depot is at Index 0.
    Jobs are Indices 1 to ${jobs.length}.
    Number of Trucks: ${truckCount}.
    
    Locations:
    ${locationListString}
    
    Task:
    1. Calculate a "Naive" routing plan: Assign jobs to trucks sequentially (1, 2, 3...) splitting them as evenly as possible.
    2. Calculate an "Optimized" routing plan: Reorder the jobs using a heuristic like Nearest Neighbor or savings algorithm to minimize total distance. 
    
    Constraints:
    - All trucks must start at Index 0.
    - All trucks must end at Index 0.
    
    Return the result strictly in JSON format. Do not calculate distances or costs, just return the sequence of indices.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          naiveRoutes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                truckId: { type: Type.INTEGER },
                pathIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
              }
            }
          },
          optimizedRoutes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                truckId: { type: Type.INTEGER },
                pathIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const rawData = JSON.parse(text);

  // Helper to map indices back to Location objects
  const mapIndicesToLocations = (indices: number[]): Location[] => {
    return indices.map(idx => allLocations[idx]);
  };

  // Helper to process a set of raw routes into full RoutePlans with real metrics
  const processRoutes = async (rawRoutes: any[], defaultColor: string | null = null): Promise<{ routes: RoutePlan[], stats: RouteStats }> => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    
    const processedRoutes: RoutePlan[] = [];
    let totalDistanceKm = 0;
    let totalTimeMinutes = 0;

    for (let i = 0; i < rawRoutes.length; i++) {
      const r = rawRoutes[i];
      const pathLocations = mapIndicesToLocations(r.pathIndices);
      
      // Fetch real route geometry and stats from OSRM
      const legStats = await getRouteForPath(pathLocations);
      
      totalDistanceKm += legStats.distanceKm;
      totalTimeMinutes += legStats.durationMinutes;

      processedRoutes.push({
        truckId: r.truckId,
        path: pathLocations,
        geometry: legStats.geometry,
        color: defaultColor || colors[i % colors.length]
      });
    }

    const estimatedFuelCost = totalDistanceKm * 1.5; // $1.50 per km approx

    return {
      routes: processedRoutes,
      stats: {
        totalDistanceKm,
        totalTimeMinutes,
        estimatedFuelCost
      }
    };
  };

  // Process both plans in parallel
  const [naiveData, optimizedData] = await Promise.all([
    processRoutes(rawData.naiveRoutes, '#ef4444'),
    processRoutes(rawData.optimizedRoutes)
  ]);

  return {
    naive: naiveData,
    optimized: optimizedData,
    savings: {
      distanceSavedKm: naiveData.stats.totalDistanceKm - optimizedData.stats.totalDistanceKm,
      timeSavedMinutes: naiveData.stats.totalTimeMinutes - optimizedData.stats.totalTimeMinutes,
      moneySaved: naiveData.stats.estimatedFuelCost - optimizedData.stats.estimatedFuelCost,
      percentImprovement: naiveData.stats.estimatedFuelCost > 0 
        ? ((naiveData.stats.estimatedFuelCost - optimizedData.stats.estimatedFuelCost) / naiveData.stats.estimatedFuelCost) * 100
        : 0
    }
  };
};