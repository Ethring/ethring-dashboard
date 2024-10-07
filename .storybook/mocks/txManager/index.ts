import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

import { mockSocketInstance } from '../../preview';
import { TX_DATA_PUT, TX_DATA_GET, TX_DATA_DEPOSIT } from '../constants';

let isDepositConditionMet = false;

export const txManagerHandler = [
    // GET request for transaction details
    http.get('https://zomet-tx-manager.3ahtim54r.ru/transactions/:id', () => {
        return HttpResponse.json(
            {
                ok: true,
                data: TX_DATA_GET,
                error: '',
            },
            {
                status: 200,
                statusText: 'GET: Mock tx status',
            },
        );
    }),

    // PUT request for updating a transaction
    http.put('https://zomet-tx-manager.3ahtim54r.ru/transactions/:id', ({ params }) => {
        let data: any = TX_DATA_PUT;

        if (params.id !== TX_DATA_PUT.id) data = TX_DATA_DEPOSIT;

        setTimeout(() => {
            mockSocketInstance.triggerEvent('update_transaction_status', data);
            mockSocketInstance.triggerEvent('update_transaction', data);

            if (data.status === 'FAILED') Worker.stop();
        }, 5000);

        isDepositConditionMet = true;

        return HttpResponse.json(
            {
                ok: true,
                data: data,
                error: '',
            },
            {
                status: 200,
                statusText: 'PUT: Mock tx status',
            },
        );
    }),

    // POST request to create a new transaction
    http.post('https://zomet-tx-manager.3ahtim54r.ru/transactions', () => {
        return HttpResponse.json(
            {
                ok: true,
                data: TX_DATA_GET,
                error: '',
            },
            {
                status: 200,
                statusText: 'POST: Mock tx data',
            },
        );
    }),

    // New handler for getAllowance API, conditionally mock based on PUT handler
    http.get('https://apps.3ahtim54r.ru/srv-portal-fi/api/getAllowance', () => {
        return HttpResponse.json(
            {
                ok: true,
                data: isDepositConditionMet ? '2' : '0',
                error: '',
            },
            {
                status: 200,
                statusText: 'GET: Mock get allowance',
            },
        );
    }),
];

export const Worker = setupWorker(...txManagerHandler);
