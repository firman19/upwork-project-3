#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('lead-sync')
  .description('CLI to sync leads between Zendesk and Instantly')
  .version('1.0.0');

program
  .command('download-leads')
  .description('Download leads from Zendesk')
  .action(async () => {
    const module = await import('./download-leads.js');
    module.default?.() || module();
  });

program
  .command('upload-leads')
  .description('Upload leads to Instantly')
  .action(async () => {
    const module = await import('./upload-leads.js');
    module.default?.() || module();
  });

program
  .command('download-leads-activity')
  .argument('<campaignId>', 'Campaign ID')
  .description('Download lead activity from Instantly')
  .action(async (id) => {
    const module = await import('./download-leads-activity.js');
    module.default?.(id) || module(id);
  });

program
  .command('upload-leads-activity')
  .argument('<campaignId>', 'Campaign ID')
  .description('Upload lead activity to Zendesk')
  .action(async (id) => {
    const module = await import('./upload-leads-activity.js');
    module.default?.(id) || module(id);
  });

program.parse();
