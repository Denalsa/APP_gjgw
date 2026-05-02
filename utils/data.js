const dishCategories = [
  {
    id: 'stir',
    name: '炒菜',
    dishes: [
      {
        id: 'd1',
        name: '黑椒牛柳意面',
        price: 32,
        stock: 12,
        image: 'cloud://prod-d6girqehu56c8172c.7072-prod-d6girqehu56c8172c-1424492094/黑椒牛柳意面.jpg',
        //image: 'cloud://your-env-id.dishes/d1.jpg'
        description: '酸甜微辣、鸡丁滑嫩。',
        ingredients: ['牛柳', '意面', '黑胡椒', '黄油', '葱姜蒜']
      },
      {
        id: 'd2',
        name: '蒜蓉西兰花',
        price: 22,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
        description: '清香爽口，低油健康。',
        ingredients: ['西兰花', '蒜蓉', '盐', '食用油']
      }
    ]
  },
  {
    id: 'stew',
    name: '炖菜',
    dishes: [
      {
        id: 'd3',
        name: '土豆炖牛腩',
        price: 46,
        stock: 10,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
        description: '牛腩软烂入味，汤汁浓郁。',
        ingredients: ['牛腩', '土豆', '胡萝卜', '洋葱', '番茄']
      }
    ]
  },
  {
    id: 'steam',
    name: '蒸菜',
    dishes: [
      {
        id: 'd4',
        name: '清蒸鲈鱼',
        price: 58,
        stock: 8,
        image: 'https://images.unsplash.com/photo-1625944525903-bbad80af84a4?auto=format&fit=crop&w=500&q=80',
        description: '鲜嫩少油，保留食材本味。',
        ingredients: ['鲈鱼', '葱丝', '姜丝', '蒸鱼豉油']
      }
    ]
  },
  {
    id: 'soup',
    name: '煲汤',
    dishes: [
      {
        id: 'd5',
        name: '老火排骨汤',
        price: 36,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=500&q=80',
        description: '汤色清亮，营养滋补。',
        ingredients: ['排骨', '玉米', '胡萝卜', '红枣', '姜片']
      }
    ]
  },
  {
    id: 'bread',
    name: '面包',
    dishes: [
      {
        id: 'd6',
        name: '法式蒜香面包',
        price: 16,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
        description: '外脆里软，蒜香浓郁。',
        ingredients: ['高筋面粉', '黄油', '蒜蓉', '欧芹']
      }
    ]
  },
  {
    id: 'cake',
    name: '蛋糕',
    dishes: [
      {
        id: 'd7',
        name: '草莓奶油蛋糕',
        price: 28,
        stock: 16,
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80',
        description: '细腻绵软，奶香顺滑。',
        ingredients: ['鸡蛋', '低筋面粉', '淡奶油', '草莓']
      }
    ]
  },
  {
    id: 'western',
    name: '西餐正餐',
    dishes: [
      {
        id: 'd8',
        name: '黑椒牛排',
        price: 88,
        stock: 9,
        image: 'cloud://cloud1-d9gw4slrf8bc6bd35.636c-cloud1-d9gw4slrf8bc6bd35-1424492094/dsh_img/黑椒牛柳意面.jpg',
        description: '肉香浓郁，黑椒微辣。',
        ingredients: ['牛排', '黑胡椒汁', '土豆泥', '芦笋']
      }
    ]
  }
];

const hotDishes = ['d1', 'd3', 'd4', 'd8'];

function getDishById(id) {
  for (const category of dishCategories) {
    const dish = category.dishes.find((item) => item.id === id);
    if (dish) {
      return { ...dish, categoryId: category.id, categoryName: category.name };
    }
  }
  return null;
}

function getHotDishImages() {
  return hotDishes
    .map((id) => getDishById(id))
    .filter(Boolean)
    .map((dish) => ({ id: dish.id, name: dish.name, image: dish.image }));
}

module.exports = {
  dishCategories,
  getDishById,
  getHotDishImages
};
