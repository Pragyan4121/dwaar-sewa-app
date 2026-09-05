import providerApi from "./provider-client";

import type {
  CreateProviderWithdrawalInput,
  CreateProviderWithdrawalResponse,
  ProviderEarningsHistoryResponse,
  ProviderEarningsStatementResponse,
  ProviderEarningsSummaryResponse,
  ProviderWalletTransactionsResponse,
  ProviderWithdrawalsResponse,
} from "@/types";

export async function getProviderEarningsSummary(): Promise<ProviderEarningsSummaryResponse> {
  const { data } = await providerApi.get<ProviderEarningsSummaryResponse>(
    "/provider/earnings/summary",
  );

  return data;
}

export async function getProviderEarningsHistory(
  page = 1,
  limit = 20,
): Promise<ProviderEarningsHistoryResponse> {
  const { data } = await providerApi.get<ProviderEarningsHistoryResponse>(
    "/provider/earnings/history",
    {
      params: {
        page,
        limit,
      },
    },
  );

  return data;
}

export async function getProviderEarningsStatementByMonth(
  year: number,
  month: number,
): Promise<ProviderEarningsStatementResponse> {
  const { data } = await providerApi.get<ProviderEarningsStatementResponse>(
    "/provider/earnings/statement",
    {
      params: {
        year,
        month,
      },
    },
  );

  return data;
}

export async function getProviderEarningsStatementByRange(
  startDate: string,
  endDate: string,
): Promise<ProviderEarningsStatementResponse> {
  const { data } = await providerApi.get<ProviderEarningsStatementResponse>(
    "/provider/earnings/statement",
    {
      params: {
        startDate,
        endDate,
      },
    },
  );

  return data;
}

export async function getProviderWalletTransactions(
  page = 1,
  limit = 20,
): Promise<ProviderWalletTransactionsResponse> {
  const { data } = await providerApi.get<ProviderWalletTransactionsResponse>(
    "/provider/earnings/transactions",
    {
      params: {
        page,
        limit,
      },
    },
  );

  return data;
}

export async function getProviderWithdrawals(
  page = 1,
  limit = 20,
): Promise<ProviderWithdrawalsResponse> {
  const { data } = await providerApi.get<ProviderWithdrawalsResponse>(
    "/provider/withdrawals",
    {
      params: {
        page,
        limit,
      },
    },
  );

  return data;
}

export async function createProviderWithdrawal(
  input: CreateProviderWithdrawalInput,
): Promise<CreateProviderWithdrawalResponse> {
  const { data } = await providerApi.post<CreateProviderWithdrawalResponse>(
    "/provider/withdrawals",
    input,
  );

  return data;
}
