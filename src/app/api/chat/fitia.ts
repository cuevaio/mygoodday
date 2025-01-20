interface FoodProduct {
  is_active: boolean;
  collection: string;
  object_id: string;
  old_id: number | null;
  identifier: string;
  slug: string;
  name: string;
  country: string;
  source: string;
  subtype: string;
  language: string;
  relevance: number;
  category_uid: string;
  calories: number;
  protein: number;
  carbs: number;
  net_carbs: number;
  fat: number;
  sat_fat: number;
  trans_fat: number | null;
  sugars: number;
  fiber: number | null;
  sodium: number | null;
  salt: number;
  has_servings: boolean;
  servings: Serving[];
  category: Category;
  brand: Brand;
  barcodes: string[];
  fg: string;
  conversion_factor: number;
  cooking_state: null;
  energy_unit: string;
  tags: Tag[];
  length: number;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
  public_id: string;
  nutritionTableType: string;
}

interface Serving {
  name: string;
  size: number;
  type: string;
  unit: string;
  default: boolean;
  quantity: string;
}

interface Category {
  slug: string;
  name: string;
  icon: {
    full_size: string;
    thumbnail: string;
  };
  shopping_category: string;
}

interface Brand {
  slug: string;
  name: string;
  country: string;
}

interface Tag {
  slug: string;
  name: string;
  level: string;
}

type FoodProducts = FoodProduct[];

export async function searchFood() {
  const res = await fetch('https://fitia.app/api/database/search/', {
    headers: {
      accept: 'application/json',
      'accept-language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7,es;q=0.6',
      baggage:
        'sentry-environment=production,sentry-release=cf76833dcbc143c8bb89dc7528134231038b34f0,sentry-public_key=0b4f77d3af3c4959cb1fa69b8188a9c0,sentry-trace_id=df6db64c1fd74441a0dec671463e394f,sentry-sample_rate=0.05,sentry-transaction=buscar-alimentos-y-recetas___es,sentry-sampled=false',
      'content-type': 'application/json',
      priority: 'u=1, i',
      'sec-ch-ua':
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'sentry-trace': 'df6db64c1fd74441a0dec671463e394f-9e732cbf864480bb-0',
      cookie:
        'consent=true; singular_device_id=b03ef8a6-49ca-46a8-8245-cb0431c5db09; source=organic; cf_clearance=1AeypoC3Mvimf6eQJlSQPVh8__WC9b0lP0tpOxqMf2c-1737050976-1.2.1.1-dtlsc.0sm3mDsP4iPFq8hxtAOe3_tTFfcaVGqJ_5VbjhPyab.9GsW0sTgzxoZSUaaB388tqA_ii6H7wUhgxCqw5.nLgeVG6Bge30NvkaqIuuMhub0nBW.8OaZy913mKQ2.37Gm8lyn9o0ci6V9nyMW9wtQLHdf6WCGl3E_1YwIGJZKHxEJuQRKd60mNEWlkn5XVIvdnhlGSVmRFBsMhBuhuEoJK2GvuN7sWUginDAM3DHjO4Qd9DQ_8CtrptruGCcwmN5pnTT4L4XyGWVCs9f6Nxce36bQqhBoIpRZ.Skdo',
      Referer:
        'https://fitia.app/es/buscar/alimentos-y-recetas/?search=integrakers&country=pe',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    body: '{"search":"integrackers","country":"PE","language":"es","start_at":0,"size":50}',
    method: 'POST',
  });

  const json = (await res.json()) as FoodProducts;

  console.log(JSON.stringify(json));

  return json;
}

searchFood();
