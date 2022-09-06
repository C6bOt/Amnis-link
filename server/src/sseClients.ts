import { Response } from 'express';

export interface Client {
  transactionUuid: string;
  response: Response;
}

let clients: Client[] = [];

export function addClient(client: Client) {
  clients = [...clients, client];
}

export function getClients() {
  return clients;
}

export function getClient(transactionUuid: string) {
  return clients.find((client) => client.transactionUuid === transactionUuid);
}

export function removeClient(transactionUuid: string) {
  clients = clients.filter((client) => client.transactionUuid !== transactionUuid);
}

export default {
  addClient, getClients, removeClient, getClient,
};
