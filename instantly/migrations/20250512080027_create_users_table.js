// migrations/YYYYMMDDHHMMSS_create_users_table.js
export async function up(knex) {
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable();
    });
  }
  
  export async function down(knex) {
    await knex.schema.dropTableIfExists('users');
  }
  