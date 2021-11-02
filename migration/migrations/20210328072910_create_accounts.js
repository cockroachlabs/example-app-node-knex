export async function up(knex) {
  await knex.schema.createTable('accounts', (table) => {
    table.uuid('id').notNullable().primary()
    table.integer('balance').nullable()
  })
}

export async function down(knex) {
  await knex.schema.dropTable('accounts')
}
