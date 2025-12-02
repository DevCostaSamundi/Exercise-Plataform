#!/bin/bash
cd /home/devcosta/Projetos/marketplace/backend
npx prisma migrate dev --name add_creator_settings_fields
npx prisma generate
