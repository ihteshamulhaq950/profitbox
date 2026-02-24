import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error("GOOGLE_GENAI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateInsight(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("GenAI Error:", error);
    throw error;
  }
}

export async function generatePricingRecommendation(
  productName: string,
  currentCost: number,
  currentPrice: number,
  salesVolume: number,
  margin: number
): Promise<string> {
  const prompt = `
You are a business intelligence analyst. Analyze the following product data and provide a brief pricing recommendation:

Product: ${productName}
Cost per unit: $${currentCost}
Current selling price: $${currentPrice}
Monthly sales volume: ${salesVolume} units
Current profit margin: ${margin.toFixed(1)}%

Provide a concise recommendation (2-3 sentences) on whether to increase, decrease, or maintain the price. Include the recommended new price and projected impact.
Keep the response practical and actionable.`;

  return generateInsight(prompt);
}

export async function generateInventoryForecast(
  productName: string,
  boxesRemaining: number,
  avgDailySales: number,
  supplierLeadDays: number
): Promise<string> {
  const daysUntilStockout = avgDailySales > 0 ? boxesRemaining / avgDailySales : 999;

  const prompt = `
You are a supply chain analyst. Analyze the following inventory data and provide a reorder recommendation:

Product: ${productName}
Boxes remaining: ${boxesRemaining}
Average daily sales: ${avgDailySales} boxes/day
Days until stockout: ${daysUntilStockout.toFixed(1)} days
Supplier lead time: ${supplierLeadDays} days

Provide a brief reorder recommendation (1-2 sentences) including suggested order quantity and timing.`;

  return generateInsight(prompt);
}

export async function generateWeeklyReport(data: {
  totalRevenue: number;
  totalProfit: number;
  totalBoxesSold: number;
  previousWeekRevenue: number;
  topProducts: { name: string; revenue: number; profit: number }[];
  lowStockProducts: string[];
}): Promise<string> {
  const revenueChange = data.previousWeekRevenue > 0 
    ? (((data.totalRevenue - data.previousWeekRevenue) / data.previousWeekRevenue) * 100).toFixed(1)
    : "N/A";

  const prompt = `
You are a business analyst writing a weekly summary report. Based on the following data, write a compelling 3-4 sentence weekly summary that a business owner would appreciate:

Weekly Revenue: $${data.totalRevenue.toFixed(2)}
Weekly Profit: $${data.totalProfit.toFixed(2)}
Profit Margin: ${((data.totalProfit / data.totalRevenue) * 100).toFixed(1)}%
Total Boxes Sold: ${data.totalBoxesSold}
Revenue Change vs Last Week: ${revenueChange}%

Top 3 Products:
${data.topProducts.map((p, i) => `${i + 1}. ${p.name} - Revenue: $${p.revenue.toFixed(2)}, Profit: $${p.profit.toFixed(2)}`).join("\n")}

Low Stock Products: ${data.lowStockProducts.length > 0 ? data.lowStockProducts.join(", ") : "None"}

Write in a professional but friendly tone. Highlight key achievements and alert to any concerns. Format as plain text, not markdown.`;

  return generateInsight(prompt);
}
