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
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Order>()
                .HasKey(e => e.Id);

            modelBuilder.Entity<Order>()
                .HasOne(e => e.Client)
                .WithMany(e => e.Orders)
                .HasForeignKey(e => e.ClientId);

        }        
    }
}
