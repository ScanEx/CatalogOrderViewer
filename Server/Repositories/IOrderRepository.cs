using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Server.Models;

namespace Server.Repositories
{
    public interface IOrderRepository
    {
        Task<Order> CreateAsync(Order order);
        Task<IEnumerable<Order>> RetrieveAllAsync();
        Task<Order> RetrieveAsync(int id);
        Task<Order> UpdateAsync(int id, Order order);
        Task<bool> DeleteAsync(int id);
    }
}
