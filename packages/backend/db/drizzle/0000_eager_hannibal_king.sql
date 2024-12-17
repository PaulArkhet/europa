CREATE TABLE IF NOT EXISTS "users" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"username" varchar,
	"password" varchar,
	"created_at" varchar,
	"active" boolean DEFAULT true,
	"email_verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"project_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar,
	"img_src" varchar DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp DEFAULT now() NOT NULL,
	"iterations" integer DEFAULT 0,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wireframes" (
	"wireframe_id" serial PRIMARY KEY NOT NULL,
	"content" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp DEFAULT now() NOT NULL,
	"iterations" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"project_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "styleguides" (
	"styleguide_id" serial PRIMARY KEY NOT NULL,
	"filename" varchar NOT NULL,
	"typography" text,
	"colors" text,
	"buttons" text,
	"radiobuttons" text,
	"textfields" text,
	"toggle" text,
	"checkboxes" text,
	"internalnavigation" text,
	"segmentedbutton" text,
	"card" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true,
	"user_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "datasets" (
	"dataset_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"title" varchar,
	"headers" varchar,
	"content" varchar,
	"created_at" varchar,
	"edited_at" varchar,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wireframes" ADD CONSTRAINT "wireframes_project_id_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "styleguides" ADD CONSTRAINT "styleguides_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
