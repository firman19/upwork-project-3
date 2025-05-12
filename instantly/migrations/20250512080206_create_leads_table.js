// migrations/YYYYMMDDHHMMSS_create_leads_table.js

export async function up(knex) {
    await knex.schema.createTable('leads', (table) => {
        table.increments('id').primary(); // auto-incrementing id
        table.string('email').unique().notNullable(); // unique email
        table.string('first_name').nullable(); // nullable first name
        table.string('last_name').nullable(); // nullable last name
        table.string('organization_name').nullable(); // nullable organization name
        table.string('phone').nullable(); // nullable phone
        table.string('category').nullable(); // nullable category
        table.timestamp('uploaded_at').nullable(); // nullable uploaded_at
        table.timestamps(true, true); // automatically adds created_at and updated_at
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('leads');
}
