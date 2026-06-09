import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const pricingConfigs = [
  // Hourly rates
  { key: "hourlyRate_fortMyers", value: "70", category: "hourly_rate", label: "Fort Myers Hourly Rate", description: "Base hourly rate for Fort Myers market" },
  { key: "hourlyRate_naples", value: "85", category: "hourly_rate", label: "Naples Hourly Rate", description: "Base hourly rate for Naples market" },
  { key: "hourlyRate_luxuryNaples", value: "100", category: "hourly_rate", label: "Luxury Naples Hourly Rate", description: "Base hourly rate for Luxury Naples market" },

  // Minimum charges
  { key: "minimumCharge_fortMyers", value: "175", category: "minimum_charge", label: "Fort Myers Minimum Charge", description: "Minimum service charge for Fort Myers" },
  { key: "minimumCharge_naples", value: "225", category: "minimum_charge", label: "Naples Minimum Charge", description: "Minimum service charge for Naples" },
  { key: "minimumCharge_luxuryNaples", value: "300", category: "minimum_charge", label: "Luxury Naples Minimum Charge", description: "Minimum service charge for Luxury Naples" },

  // Frequency multipliers
  { key: "frequencyMultiplier_weekly", value: "0.90", category: "frequency", label: "Weekly Multiplier", description: "Price multiplier for weekly service" },
  { key: "frequencyMultiplier_biweekly", value: "1.00", category: "frequency", label: "Bi-Weekly Multiplier", description: "Price multiplier for bi-weekly service" },
  { key: "frequencyMultiplier_monthly", value: "1.20", category: "frequency", label: "Monthly Multiplier", description: "Price multiplier for monthly service" },
  { key: "frequencyMultiplier_oneTime", value: "1.35", category: "frequency", label: "One-Time Multiplier", description: "Price multiplier for one-time service" },
  { key: "frequencyMultiplier_deepClean", value: "1.75", category: "frequency", label: "Deep Clean Multiplier", description: "Price multiplier for deep clean service" },

  // Travel fees
  { key: "travelFee_0_10", value: "0", category: "travel", label: "Travel Fee 0-10 miles", description: "Travel fee for 0-10 mile radius" },
  { key: "travelFee_10_20", value: "25", category: "travel", label: "Travel Fee 10-20 miles", description: "Travel fee for 10-20 mile radius" },
  { key: "travelFee_20_30", value: "50", category: "travel", label: "Travel Fee 20-30 miles", description: "Travel fee for 20-30 mile radius" },

  // Add-on pricing
  { key: "addon_oven", value: "50", category: "addon", label: "Oven Cleaning", description: "Price per oven cleaning" },
  { key: "addon_refrigerator", value: "50", category: "addon", label: "Refrigerator Cleaning", description: "Price per refrigerator cleaning" },
  { key: "addon_interiorWindows", value: "8", category: "addon", label: "Interior Windows (per window)", description: "Price per interior window" },
  { key: "addon_baseboards", value: "75", category: "addon", label: "Baseboards", description: "Price for baseboard cleaning" },
  { key: "addon_ceilingFans", value: "5", category: "addon", label: "Ceiling Fans (per fan)", description: "Price per ceiling fan" },
  { key: "addon_insideCabinets", value: "100", category: "addon", label: "Inside Cabinets", description: "Price for inside cabinet cleaning" },
  { key: "addon_laundry", value: "50", category: "addon", label: "Laundry Service", description: "Price for laundry service" },
  { key: "addon_linens", value: "25", category: "addon", label: "Linen Change", description: "Price per linen change service" },

  // Seasonal multipliers
  { key: "seasonalMultiplier_high", value: "1.10", category: "seasonal", label: "High Season Multiplier (Nov-Apr)", description: "Seasonal pricing multiplier for November through April" },
  { key: "seasonalMultiplier_low", value: "1.00", category: "seasonal", label: "Low Season Multiplier (May-Oct)", description: "Seasonal pricing multiplier for May through October" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@swflcleaning.com" },
    update: {},
    create: {
      email: "admin@swflcleaning.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create staff user
  const staffPassword = await bcrypt.hash("staff123!", 12);
  const staff = await prisma.user.upsert({
    where: { email: "staff@swflcleaning.com" },
    update: {},
    create: {
      email: "staff@swflcleaning.com",
      name: "Office Staff",
      password: staffPassword,
      role: "STAFF",
    },
  });
  console.log("✅ Staff user created:", staff.email);

  // Seed pricing config
  for (const config of pricingConfigs) {
    await prisma.pricingConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: {
        ...config,
        type: "number",
      },
    });
  }
  console.log("✅ Pricing config seeded:", pricingConfigs.length, "records");

  // Sample customers
  const customers = [
    { firstName: "Margaret", lastName: "Williams", email: "margaret.w@email.com", phone: "2395550101", address: "1250 Gulf Shore Blvd N", city: "Naples", zip: "34102" },
    { firstName: "Robert", lastName: "Johnson", email: "rjohnson@email.com", phone: "2395550102", address: "3400 Bonita Beach Rd", city: "Bonita Springs", zip: "34134" },
    { firstName: "Patricia", lastName: "Davis", email: "pat.davis@email.com", phone: "2395550103", address: "8000 Via Sardinia Way", city: "Estero", zip: "33928" },
    { firstName: "Michael", lastName: "Miller", email: "mmiller@email.com", phone: "2395550104", address: "15100 Bimini Bay Blvd", city: "Cape Coral", zip: "33993" },
    { firstName: "Linda", lastName: "Wilson", email: "linda.w@email.com", phone: "2395550105", address: "5000 Royal Marco Way", city: "Marco Island", zip: "34145" },
    { firstName: "James", lastName: "Anderson", email: "janderson@email.com", phone: "2395550106", address: "1800 Vanderbilt Beach Rd", city: "Naples", zip: "34109" },
    { firstName: "Barbara", lastName: "Taylor", email: "btaylor@email.com", phone: "2395550107", address: "12000 McGregor Blvd", city: "Fort Myers", zip: "33919" },
    { firstName: "Thomas", lastName: "Martinez", email: "tmartinez@email.com", phone: "2395550108", address: "9000 Pelican Bay Blvd", city: "Naples", zip: "34108" },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: `seed-${c.lastName.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-${c.lastName.toLowerCase()}`,
        ...c,
        phone: c.phone,
      },
    });
  }
  console.log("✅ Sample customers seeded:", customers.length, "records");

  // Sample estimates
  const sampleCustomer = await prisma.customer.findFirst({ where: { city: "Naples" } });
  if (sampleCustomer) {
    const now = new Date();
    const estimateData = [
      { status: "APPROVED" as const, roundedPrice: 425, frequency: "BIWEEKLY" as const, city: "Naples", daysAgo: 2 },
      { status: "SENT" as const, roundedPrice: 325, frequency: "WEEKLY" as const, city: "Fort Myers", daysAgo: 3 },
      { status: "CONVERTED" as const, roundedPrice: 575, frequency: "MONTHLY" as const, city: "Naples", daysAgo: 5 },
      { status: "DRAFT" as const, roundedPrice: 250, frequency: "ONE_TIME" as const, city: "Bonita Springs", daysAgo: 1 },
      { status: "APPROVED" as const, roundedPrice: 700, frequency: "DEEP_CLEAN" as const, city: "Naples", daysAgo: 7 },
    ];

    for (let i = 0; i < estimateData.length; i++) {
      const d = estimateData[i];
      const createdAt = new Date(now.getTime() - d.daysAgo * 86400000);
      const num = `EST-SEED${String(i + 1).padStart(4, "0")}`;
      await prisma.estimate.upsert({
        where: { estimateNumber: num },
        update: {},
        create: {
          estimateNumber: num,
          customerId: sampleCustomer.id,
          createdById: admin.id,
          status: d.status,
          squareFootage: 2200 + i * 200,
          bedrooms: 3,
          bathrooms: 2.5,
          city: d.city,
          occupancy: "FAMILY",
          flooringType: "MOSTLY_TILE",
          condition: "AVERAGE",
          petLevel: "NO_PETS",
          firstTimeType: "FIRST_VISIT",
          frequency: d.frequency,
          marketArea: d.city === "Naples" ? "NAPLES" : "FORT_MYERS",
          baseHours: 5.5,
          productionHours: 6.875,
          basePrice: d.roundedPrice * 0.9,
          travelFee: 0,
          addOnTotal: 0,
          finalPrice: d.roundedPrice,
          roundedPrice: d.roundedPrice,
          convertedToJob: d.status === "CONVERTED",
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
    console.log("✅ Sample estimates seeded");
  }

  console.log("\n🎉 Seed complete!");
  console.log("\nCredentials:");
  console.log("  Admin:  admin@swflcleaning.com / admin123!");
  console.log("  Staff:  staff@swflcleaning.com / staff123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
