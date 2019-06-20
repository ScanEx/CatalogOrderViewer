using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server
{
    public class CatalogContext : DbContext
    {
        public CatalogContext(DbContextOptions options) : base(options) { }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Region> Regions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<RegionGranule>()
                .HasKey(e => new { e.RegionId, e.GranuleId });

            modelBuilder.Entity<RegionGranule>()
                .HasOne(e => e.Granule)
                .WithMany(e => e.Regions)
                .HasForeignKey(e => e.GranuleId);

            modelBuilder.Entity<RegionGranule>()
                .HasOne(e => e.Region)
                .WithMany(e => e.Granules)
                .HasForeignKey(e => e.RegionId);

            // modelBuilder.Entity<Order>()
            //     .HasKey(e => e.Id);

            // modelBuilder.Entity<Order>()
            //     .HasOne(e => e.Client)
            //     .WithMany(e => e.Orders)
            //     .HasForeignKey(e => e.ClientId);

            // modelBuilder.Entity<Granule>()
            //     .HasKey(e => e.Id);

            // modelBuilder.Entity<Granule>()
            //     .HasOne(e => e.Order)
            //     .WithMany(e => e.Granules)
            //     .HasForeignKey(e => e.OrderId);            

            // modelBuilder.Entity<Roi>()
            //     .HasKey(e => e.Id);

            // modelBuilder.Entity<Roi>()
            //     .HasOne(e => e.Order)
            //     .WithMany(e => e.Rois)
            //     .HasForeignKey(e => e.OrderId);

            // modelBuilder.Entity<SupplierInvoice>()
            //     .HasKey(e => e.Id);

            // modelBuilder.Entity<SupplierInvoice>()
            //     .HasOne(e => e.Order)
            //     .WithMany(e => e.SupplierInvoices)
            //     .HasForeignKey(e => e.OrderId);
        }        
    }
}
