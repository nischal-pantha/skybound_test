
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface WeightBalanceData {
  aircraft: string;
  totalWeight: number;
  centerOfGravity: number;
  totalMoment: number;
  stations: Array<{
    name: string;
    weight: number;
    arm: number;
    moment: number;
  }>;
  isValid: boolean;
  maxWeight: number;
  cgLimits: {
    forward: number;
    aft: number;
  };
}

export const exportWeightBalanceToPDF = async (data: WeightBalanceData) => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('WEIGHT AND BALANCE COMPUTATION', 20, 20);
  
  pdf.setFontSize(12);
  pdf.text(`Aircraft: ${data.aircraft.toUpperCase()}`, 20, 35);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 120, 35);
  pdf.text(`Time: ${new Date().toLocaleTimeString()}`, 20, 45);
  
  // Loading schedule table
  pdf.setFontSize(14);
  pdf.text('LOADING SCHEDULE', 20, 65);
  
  pdf.setFontSize(10);
  let yPos = 80;
  
  // Table headers
  pdf.text('ITEM', 20, yPos);
  pdf.text('WEIGHT (LBS)', 80, yPos);
  pdf.text('ARM (IN)', 120, yPos);
  pdf.text('MOMENT (IN-LBS)', 160, yPos);
  
  // Draw line under headers
  pdf.line(20, yPos + 2, 200, yPos + 2);
  yPos += 10;
  
  // Table data
  data.stations.forEach((station) => {
    pdf.text(station.name, 20, yPos);
    pdf.text(station.weight.toFixed(1), 80, yPos);
    pdf.text(station.arm.toFixed(1), 120, yPos);
    pdf.text(station.moment.toFixed(0), 160, yPos);
    yPos += 8;
  });
  
  // Total line
  pdf.line(20, yPos, 200, yPos);
  yPos += 8;
  pdf.setFontSize(12);
  pdf.text('TOTAL', 20, yPos);
  pdf.text(data.totalWeight.toFixed(1), 80, yPos);
  pdf.text(data.centerOfGravity.toFixed(2), 120, yPos);
  pdf.text(data.totalMoment.toFixed(0), 160, yPos);
  
  // Aircraft limits
  yPos += 20;
  pdf.setFontSize(14);
  pdf.text('AIRCRAFT LIMITS', 20, yPos);
  yPos += 15;
  pdf.setFontSize(10);
  pdf.text(`Maximum Weight: ${data.maxWeight} lbs`, 20, yPos);
  yPos += 8;
  pdf.text(`CG Range: ${data.cgLimits.forward}" to ${data.cgLimits.aft}"`, 20, yPos);
  
  // Verification
  yPos += 20;
  pdf.setFontSize(14);
  pdf.text('VERIFICATION', 20, yPos);
  yPos += 15;
  pdf.setFontSize(12);
  
  const weightStatus = data.totalWeight <= data.maxWeight ? 'WITHIN LIMITS' : 'EXCEEDS LIMITS';
  const cgStatus = data.centerOfGravity >= data.cgLimits.forward && data.centerOfGravity <= data.cgLimits.aft ? 'WITHIN LIMITS' : 'OUT OF LIMITS';
  const overallStatus = data.isValid ? 'APPROVED FOR FLIGHT' : 'NOT APPROVED';
  
  pdf.setTextColor(data.totalWeight <= data.maxWeight ? 0 : 255, data.totalWeight <= data.maxWeight ? 128 : 0, 0);
  pdf.text(`Weight: ${weightStatus}`, 20, yPos);
  yPos += 10;
  
  pdf.setTextColor(cgStatus === 'WITHIN LIMITS' ? 0 : 255, cgStatus === 'WITHIN LIMITS' ? 128 : 0, 0);
  pdf.text(`CG: ${cgStatus}`, 20, yPos);
  yPos += 10;
  
  pdf.setTextColor(data.isValid ? 0 : 255, data.isValid ? 128 : 0, 0);
  pdf.setFontSize(14);
  pdf.text(`Overall: ${overallStatus}`, 20, yPos);
  
  // Save the PDF
  pdf.save(`weight-balance-${data.aircraft}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const printWeightBalance = () => {
  window.print();
};
