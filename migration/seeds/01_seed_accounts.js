import { v4 as uuidv4 } from "uuid";

export async function seed (knex) {
    await knex('accounts').delete()
    await knex('accounts').insert([
        {
            id: uuidv4(),
            balance: 1000,
        },
        {
            id: uuidv4(),
            balance: 250,
        },
        {
            id: uuidv4(),
            balance: 0,
        },
    ])
}
