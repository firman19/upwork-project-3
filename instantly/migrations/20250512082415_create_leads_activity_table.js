// migrations/YYYYMMDDHHMMSS_create_leads_activity_table.js

export async function up(knex) {
    await knex.schema.createTable('leads_activity', (table) => {
        table.increments('id').primary(); // auto-incrementing id
        table.string('campaign_id').notNullable(); // mandatory campaign_id
        table.string('campaign_name').notNullable(); // mandatory campaign_name
        table.string('email').notNullable(); // mandatory email
        table.json('activity_list').nullable(); // nullable activity_list (JSON)
        table.timestamp('uploaded_at').nullable(); // nullable uploaded_at
        table.timestamps(true, true); // automatically adds created_at and updated_at

        // Define the unique constraint on the pair of campaign_id and email
        table.unique(['campaign_id', 'email']);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('leads_activity');
}
