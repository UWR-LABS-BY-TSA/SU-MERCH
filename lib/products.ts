export type Product = {
  id: string
  name: string
  price: number
  type: "hoodie" | "tee" | "mug" | "cap" | "tote" | "keychain"
  description: string
  colors?: { label: string; hex: string }[]
  sizes?: string[]
  /** Optional GLB model URL — when provided, replaces the 3D primitive. */
  modelUrl?: string
  /** Optional product photo for the detail panel. */
  imageUrl?: string
  /** Tags appearing in the panel header. */
  tags?: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: "varsity-hoodie",
    name: "Varsity Heavyweight Hoodie",
    price: 98,
    type: "hoodie",
    description:
      "14-oz cotton-fleece pullover with embroidered SU crest, antique-brass eyelets, and a boxy drop-shoulder fit. Pre-washed for that lived-in campus feel.",
    colors: [
      { label: "Burgundy", hex: "#93000B" },
      { label: "Gold", hex: "#FFB100" },
      { label: "Cream", hex: "#f1e6c8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    imageUrl: "/hoodie-1.png",
    tags: ["Bestseller", "Class of '26"],
  },
  {
    id: "kai-hoodie",
    name: "Kai Cenat Signature Hoodie",
    price: 120,
    type: "hoodie",
    description:
      "Heavyweight fleece with chainstitched 'KAI' script. Limited run of 2,025 — numbered hangtag on every piece.",
    colors: [
      { label: "Cream", hex: "#f1e6c8" },
      { label: "Charcoal", hex: "#14100c" },
    ],
    sizes: ["S", "M", "L", "XL"],
    tags: ["Limited · 2026 made"],
  },
  {
    id: "su-crest-hoodie",
    name: "SU Crest Hoodie",
    price: 88,
    type: "hoodie",
    description:
      "The everyday SU crest in burgundy fleece. Ribbed cuffs and hem, kangaroo pocket.",
    colors: [
      { label: "Burgundy", hex: "#93000B" },
      { label: "Gold", hex: "#FFB100" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    imageUrl: "/hoodie-2.png",
    tags: ["Everyday"],
  },
  {
    id: "campus-tee",
    name: "Campus Tour Tee",
    price: 42,
    type: "tee",
    description: "220-gsm ringspun cotton. Screen-printed campus-tour list on the back.",
    colors: [
      { label: "Cream", hex: "#f1e6c8" },
      { label: "Burgundy", hex: "#93000B" },
      { label: "Gold", hex: "#FFB100" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "su-mug",
    name: "SU Enamel Mug",
    price: 22,
    type: "mug",
    description: "12-oz vitreous-enamel mug with a chip-resistant rim. Ceramic-safe up to 400°F.",
    colors: [
      { label: "Burgundy", hex: "#93000B" },
      { label: "Cream", hex: "#f1e6c8" },
      { label: "Gold", hex: "#FFB100" },
    ],
  },
  {
    id: "su-cap",
    name: "Dad Cap — SU",
    price: 34,
    type: "cap",
    description: "Low-profile six-panel cap with 3D embroidered SU. Brass buckle closure.",
    colors: [
      { label: "Burgundy", hex: "#93000B" },
      { label: "Charcoal", hex: "#14100c" },
      { label: "Cream", hex: "#f1e6c8" },
    ],
    sizes: ["One size"],
  },
  {
    id: "su-tote",
    name: "Campus Canvas Tote",
    price: 28,
    type: "tote",
    description: "12-oz duck canvas tote with reinforced double-stitched straps. Holds 4 textbooks.",
    colors: [{ label: "Burgundy", hex: "#93000B" }],
  },
]

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}
