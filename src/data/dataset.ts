/** Synthetic in-memory dataset – no real personal or client data. */

export interface OrderRecord {
  id: string;
  userId: string;
  product: string;
  quantity: number;
  unitPriceCents: number;
  status: "pending" | "shipped" | "cancelled";
  createdAt: string; // ISO 8601
}

export const ORDERS: OrderRecord[] = [
  {
    id: "ord-001",
    userId: "user-alpha",
    product: "Widget A",
    quantity: 2,
    unitPriceCents: 1999,
    status: "shipped",
    createdAt: "2024-01-10T08:00:00.000Z",
  },
  {
    id: "ord-002",
    userId: "user-beta",
    product: "Gadget B",
    quantity: 1,
    unitPriceCents: 4999,
    status: "pending",
    createdAt: "2024-01-11T09:15:00.000Z",
  },
  {
    id: "ord-003",
    userId: "user-alpha",
    product: "Doohickey C",
    quantity: 5,
    unitPriceCents: 799,
    status: "cancelled",
    createdAt: "2024-01-12T11:30:00.000Z",
  },
  {
    id: "ord-004",
    userId: "user-gamma",
    product: "Widget A",
    quantity: 3,
    unitPriceCents: 1999,
    status: "shipped",
    createdAt: "2024-01-13T14:00:00.000Z",
  },
  {
    id: "ord-005",
    userId: "user-delta",
    product: "Thingamajig D",
    quantity: 1,
    unitPriceCents: 12999,
    status: "pending",
    createdAt: "2024-01-14T16:45:00.000Z",
  },
];

/** Synthetic users with roles. */
export interface UserRecord {
  id: string;
  name: string;
  role: "admin" | "viewer";
  /** Simulated bearer token for tests – not a real secret. */
  token: string;
}

export const USERS: UserRecord[] = [
  { id: "usr-001", name: "Alice Admin", role: "admin", token: "token-admin-alice" },
  { id: "usr-002", name: "Bob Viewer", role: "viewer", token: "token-viewer-bob" },
];

/** Resolve a bearer token to a user, or undefined if unknown. */
export function getUserByToken(token: string): UserRecord | undefined {
  return USERS.find((u) => u.token === token);
}
