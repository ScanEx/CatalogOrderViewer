using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly CatalogContext db;
        public OrderRepository(CatalogContext db)
        {
            this.db = db;
        }
        public async Task<Order> CreateAsync(Order e)        
        {            
            var added = await this.db.Orders.AddAsync(e);
            int affected = await this.db.SaveChangesAsync();
            if (affected == 1)
            {
                return e;
            }
            else
            {
                return null;                
            }            
        }
        public async Task<bool> DeleteAsync(int id)
        {
            return await Task.Run(() => {
                var e = this.db.Orders.Find(id);
                if (e != null)
                {
                    this.db.Orders.Remove(e);
                    int affected = this.db.SaveChanges();
                    return affected == 1;
                }
                else
                {
                    return false;
                }
            });
        }
        public async Task<IEnumerable<Order>> RetrieveAllAsync()
        {
            return await Task.Run(() => this.db.Orders.Include(e => e.Client));
        }
        public async Task<Order> RetrieveAsync(int id)
        {
            return await this.db.Orders.FindAsync(id);                
        }
        public async Task<Order> UpdateAsync(int id, Order order)
        {
            return await Task.Run(() => {
                var existing = this.db.Orders.Find(id);
                if (existing == null || order.Id != id)
                {
                    return null;
                }
                else
                {
                    this.db.Orders.Update(order);
                    int affected = this.db.SaveChanges();
                    if (affected == 1) {
                        return order;
                    }
                    else {
                        return null;
                    }
                }                
            });
        }
    }
}